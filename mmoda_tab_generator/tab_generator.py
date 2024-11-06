#!/usr/bin/env python
import shutil

import requests
import json
from jinja2 import Environment, PackageLoader
import os
import argparse
from mmoda_tab_generator import Config
import time
import jwt
import logging
import subprocess

logger = logging.getLogger(__name__)

class MMODATabGenerator:
    def __init__(self, dispatcher_url):
        self.dispatcher_url = dispatcher_url

    def _get_token(self):
        secret_key = os.getenv('ODA_JWT_SECRET')
        if secret_key:
            token_payload = {'sub': 'oda-bot@odahub.io',
                             'email': 'oda-bot@odahub.io',
                             'name': 'oda-bot',
                             'roles': 'oda workflow developer',
                             'exp': time.time()+300}
            token = jwt.encode(token_payload, secret_key, algorithm='HS256') # TODO: hardcoded algorithm
        else:
            logger.warning('Will try to get instrument meta-data as unauthenticated user.')
            token = None

        return token

        
    def _request_data(self, instrument_name, num_try = 5, sleep_base=10, sleep_multiplier=2):
        sleep_time = sleep_base
        meta_data_url = '/'.join([self.dispatcher_url.strip('/'), 'api/meta-data'])
        params = {'instrument': instrument_name}
        exceptions = []
                
        for n in range(num_try):
            token = self._get_token()
            if token is not None: 
                params['token'] = token

            try:
                res = requests.get(meta_data_url, params = params)
                if res.status_code == 200:
                    return json.loads(res.text)
                else:
                    raise RuntimeError('%s instrument metadata URL %s request status code %s', instrument_name, meta_data_url, res.status_code)

            except Exception as e:
                logger.error('Error getting %s metadata from dispatcher URL: %s (attempt %s): %s', instrument_name, meta_data_url, num_try+1, repr(e))
                exceptions.append(e)
                time.sleep(sleep_time)
                sleep_time *= sleep_multiplier
                continue

        raise RuntimeError('Unable to get data from dispatcher. Exceptions were %s', repr(exceptions))

    def _arrange_data(self, instrument_name):
        jmeta = self._request_data(instrument_name)
                
        param_dict = {}
        products_list = []
        
        # we relay on the metadata order, not ideal but better than e.g. query_name that may be redefined
        _item = jmeta[0][3]
        if isinstance(_item, str):
            item = json.loads(_item)
        else:
            item = _item
        for par in item[1:]:
            if par['name'] == 'T_format':
                continue
            param_dict[par['name']] = par
            param_dict[par['name']]['in_instr_query'] = True

        for _item in jmeta[0][4:]:
            if isinstance(_item, str):
                item = json.loads(_item)
            else:
                item = _item
            product_name = item[1]['product_name']
            products_list.append(product_name)
            for par in item[2:]:
                if par['name'] == 'T_format':
                    continue
                if par['name'] in param_dict.keys():
                    param_dict[par['name']]['products'].append(product_name)
                else:
                    param_dict[par['name']] = par
                    param_dict[par['name']]['products'] = [product_name]
                param_dict[par['name']]['in_instr_query'] = False

        return param_dict, products_list

    @staticmethod
    def _check_euclid(param_dict):
        euclid_table_uri = 'http://odahub.io/ontology#PhosphorosFiltersTable' 
        
        is_euclid = False
        euclid_filters_lists = euclid_table_parname_list = euclid_product_name_list = None

        for pname, pval in param_dict.items():
            if euclid_table_uri in pval.get('owl_uri', []):
                print("pname: ", pname)
                print("pval: ", json.dumps(pval, indent=4))
                is_euclid = True
                if euclid_table_parname_list is None:
                    euclid_table_parname_list = []
                euclid_table_parname_list.append(pname)
                if euclid_filters_lists is None:
                    euclid_filters_lists = []
                euclid_filters_lists.append(pval['restrictions']['schema']['properties']['filter']['items']['enum'])
                if euclid_product_name_list is None:
                    euclid_product_name_list = []
                # We assume that only one filter table per product, is present, and each has a different name
                euclid_product_name_list.append(pval['products'][0])

        return is_euclid, euclid_table_parname_list, euclid_filters_lists, euclid_product_name_list

    @staticmethod
    def snake_case(s):
        return '_'.join(word.lower() for word in s.split())
    
    def generate(self, 
                 instrument_name, 
                 instruments_dir_path, 
                 frontend_name, 
                 title, 
                 messenger, 
                 roles, 
                 form_dispatcher_url, 
                 weight, 
                 citation = '',
                 instrument_version=None,
                 instrument_version_link=None,
                 help_page = None):
        param_dict, products_list = self._arrange_data(instrument_name)
        
        this_instr_path = os.path.join(instruments_dir_path, f"mmoda_{frontend_name}")
        os.makedirs(this_instr_path, exist_ok=True)
        this_instr_js_path = os.path.join(this_instr_path, "js")
        os.makedirs(this_instr_js_path, exist_ok=True)
        basename = os.path.join(this_instr_path, f"mmoda_{frontend_name}")

        css_fname = None
        euclid_csv_name = 'euclid_filters_{}.csv'
        euclid_csv_name_list = []

        is_euclid, euclid_table_parname_list, euclid_filters_lists, euclid_product_name_list = self._check_euclid(param_dict)

        jenv = Environment(loader=PackageLoader('mmoda_tab_generator'))
        jenv.filters['snake_case'] = self.snake_case
        
        if is_euclid:
            css_fname = "mmoda_euclid.css"
            templ = jenv.get_template('euclid/mmoda_euclid.css')
            with open(os.path.join(this_instr_path, css_fname), 'w') as fd:
                fd.write(templ.render())

            js_fname = "mmoda_euclid.js"
            templ = jenv.get_template('euclid/mmoda_euclid.js')
            with open(os.path.join(this_instr_js_path, js_fname), 'w') as fd:
                fd.write(templ.render())

            for p_list_id, product_name in enumerate(euclid_product_name_list):
                csv_file_name = euclid_csv_name.format(product_name)
                euclid_csv_name_list.append(csv_file_name)
                with open(os.path.join(this_instr_path, csv_file_name), 'w') as fd:
                    fd.write('Instrument,Filter\n')
                    for flt in euclid_product_name_list[p_list_id]:
                        fd.write(','.join(flt.split('|'))+'\n')
            
        templ = jenv.get_template('instr.info')
        with open(f"{basename}.info", 'w') as fd:
            fd.write(templ.render(frontend_name = frontend_name,
                                  instrument_title = title,
                                  stylesheet = css_fname
                                  ))

        templ = jenv.get_template('instr.module')
        with open(f"{basename}.module", 'w') as fd:
            fd.write(templ.render(frontend_name = frontend_name,
                                  instrument_title = title))

        templ = jenv.get_template('instr.install')
        defaults = []
        for k, v in param_dict.items():
            if k not in euclid_table_parname_list:
                if isinstance(v['value'], bool):
                    defaults.append((k, int(v['value'])))
                else:
                    defaults.append((k, v['value']))
        with open(f"{basename}.install", 'w') as fd:
            fd.write(templ.render(frontend_name = frontend_name,
                                  instrument_title = title,
                                  defaults = defaults, 
                                  default_product_type = products_list[0],
                                  roles = roles,
                                  weight=weight,
                                  messenger=messenger,
                                  citation=citation,
                                  instrument_version=instrument_version,
                                  instrument_version_link=instrument_version_link,
                                  is_euclid=is_euclid,
                                  euclid_csv_name_list=euclid_csv_name_list,
                                  euclid_table_parname_list=euclid_table_parname_list))

        templ = jenv.get_template('instr.inc')
        with open(f"{basename}.inc", 'w') as fd:
            fd.write(templ.render(form_dispatcher_url = form_dispatcher_url,
                                  frontend_name = frontend_name,
                                  dispatcher_name = instrument_name,
                                  param_dict = param_dict,
                                  products_list = products_list,
                                  euclid_table_parname_list = euclid_table_parname_list))
        
        if help_page is not None:
            help_book_dir = os.path.join(this_instr_path, 'help_book')
            os.makedirs(help_book_dir, exist_ok=True)
            with open(os.path.join(help_book_dir, f"mmoda_{frontend_name}_help.html"), 'w') as fd:
                fd.write(help_page)


def main():
    parser = argparse.ArgumentParser(description = 'Generate MMODA frontend tab')
    parser.add_argument('-u', '--url')
    parser.add_argument('-n', '--name', required=True)
    parser.add_argument('-N', '--title')
    parser.add_argument('-p', '--path')
    parser.add_argument('-c', '--config')
    parser.add_argument('-r', '--roles', default='developer')
    parser.add_argument('--frontend_name')
    parser.add_argument('--messenger', default = ' ')
    parser.add_argument('--form_dispatcher_url', default='dispatch-data/run_analysis')
    parser.add_argument('-w', required=True)
    parser.add_argument('--citation', default='Service provided by <a href="https://github.com/oda-hub" target="_blank">MMODA</a>')
    parser.add_argument('--instrument_version', default=None)
    parser.add_argument('--instrument_version_link', default=None)
    args = parser.parse_args()
    
    if not args.config:
        if not args.url or not args.path:
            parser.error('Either config file path (-c) or both dispatcher url (-u) and frontend instruments dir (-p) need to be defined.')
    
    if args.config:
        conf = Config(args.config)
        
    dispatcher_url = args.url if args.url else conf.dispatcher_url
    instruments_dir_path = args.path if args.path else conf.instruments_dir_path
    instrument_name = args.name
    frontend_name = args.frontend_name if args.frontend_name else instrument_name
    title = args.title if args.title else ' '.join([x.capitalize() for x in instrument_name.replace('_', ' ').split()])
    roles = args.roles
    form_dispatcher_url = args.form_dispatcher_url 
    weight = args.w
    messenger = args.messenger
    citation = args.citation
    instrument_version = args.instrument_version
    instrument_version_link = args.instrument_version_link
    
    generator = MMODATabGenerator(dispatcher_url)
    generator.generate(instrument_name, 
                       instruments_dir_path, 
                       frontend_name, 
                       title,
                       messenger,
                       roles, 
                       form_dispatcher_url,
                       weight,
                       citation,
                       instrument_version,
                       instrument_version_link)
    
if __name__ == '__main__':
    main()