#!/usr/bin/env python

import requests
import json
from jinja2 import Environment, PackageLoader
import os
import argparse
from mmoda_tab_generator import Config

class MMODATabGenerator:
    def __init__(self, dispatcher_url):
        self.dispatcher_url = dispatcher_url
        
    def _request_data(self, instrument_name, num_try = 5):
        for n in range(num_try):        
            try:
                res = requests.get('/'.join([self.dispatcher_url.strip('/'), 'api/meta-data']),
                                params={'instrument': instrument_name})
                if res.status_code == 200:
                    return json.loads(res.text)
            except:
                continue
        raise RuntimeError('Unable to get data from dispatcher')

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
                if par['name'] in param_dict.keys():
                    param_dict[par['name']]['products'].append(product_name)
                else:
                    param_dict[par['name']] = par
                    param_dict[par['name']]['products'] = [product_name]
                param_dict[par['name']]['in_instr_query'] = False

        return param_dict, products_list


    def generate(self, instrument_name, instruments_dir_path, frontend_name, roles, form_dispatcher_url):
        param_dict, products_list = self._arrange_data(instrument_name)
        
        this_instr_path = os.path.join(instruments_dir_path, f"mmoda_{frontend_name}")
        os.makedirs(this_instr_path, exist_ok=True)
        basename = os.path.join(this_instr_path, f"mmoda_{frontend_name}")
        
        jenv = Environment(loader=PackageLoader('mmoda_tab_generator')) 

        templ = jenv.get_template('instr.info')
        with open(f"{basename}.info", 'w') as fd:
            fd.write(templ.render(instrument_name = frontend_name))

        templ = jenv.get_template('instr.module')
        with open(f"{basename}.module", 'w') as fd:
            fd.write(templ.render(instrument_name = frontend_name))

        templ = jenv.get_template('instr.install')
        with open(f"{basename}.install", 'w') as fd:
            fd.write(templ.render(instrument_name = frontend_name,
                                  defaults = [(k, v['value']) for k, v in param_dict.items()], 
                                  default_product_type = products_list[0],
                                  roles = roles))

        templ = jenv.get_template('instr.inc')
        with open(f"{basename}.inc", 'w') as fd:
            fd.write(templ.render(form_dispatcher_url = form_dispatcher_url,
                                  instrument_name = frontend_name,
                                  dispatcher_name = instrument_name,
                                  param_dict = param_dict,
                                  products_list = products_list))
        


def main():
    parser = argparse.ArgumentParser(description = 'Generate MMODA frontend tab')
    parser.add_argument('-u', '--url')
    parser.add_argument('-n', '--name', required=True)
    parser.add_argument('-p', '--path')
    parser.add_argument('-c', '--config')
    parser.add_argument('-r', '--roles', default='developer')
    parser.add_argument('--frontend_name')
    parser.add_argument('--form_dispatcher_url', default='dispatch-data/run_analysis')
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
    roles = args.roles
    form_dispatcher_url = args.form_dispatcher_url 
    
    generator = MMODATabGenerator(dispatcher_url)
    generator.generate(instrument_name, 
                       instruments_dir_path, 
                       frontend_name, 
                       roles, 
                       form_dispatcher_url)
    
if __name__ == '__main__':
    main()