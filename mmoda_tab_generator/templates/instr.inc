{% from 'euclid/macros.j2' import euclid_form_field %}
{% macro formfield(par_name, par_detail) -%}
  {% if 'http://odahub.io/ontology#FileReference' in par_detail['owl_uri'] %}
    {% for element in ['type', 'url', 'file'] %}
      $form['{{ par_name }}_{{ element }}'] = array(
        '#type' => {% if element == 'type' %}'radios'{% elif element == 'url' %}'textfield'{% else %}'file'{% endif %},
        '#title' => t({% if element == 'type' %}'{{ par_name }}'{% elif element == 'url' %}'File URL'{% else %}'Upload a file'{% endif %},),
        {% if element == 'url' and 'http://odahub.io/ontology#FileURL' in par_detail['owl_uri'] %}
        '#default_value' => t($instrument_defaults['{{ par_name }}']),
        {% endif %}
        {% if 'products' in par_detail %}
          '#states' => array(
            {% set ns = namespace(prod_sets = []) %}
            {% for x in par_detail.products %}
            {% set ns.prod_sets = ns.prod_sets + ["array('value' => '%s')" % x] %}
            {% endfor %}
            'visible' => array(
              ':input[name="' . $mform_id . 'product_type"]' => array(
                {{ ", 'or', ".join(ns.prod_sets) }}
              )
              {% if element == 'url' or element == 'file' %}
                ,'and',
                ':input[name="' . $mform_id . '{{ par_name }}_type"]' => array(
                  array('value' => '{{ element }}')
                )
              {% endif %}
            ),
            'enabled' => array(
              ':input[name="' . $mform_id . 'product_type"]' => array(
                {{ ", 'or', ".join(ns.prod_sets) }}
              )
              {% if element == 'url' or element == 'file' %}
                ,'and',
                ':input[name="' . $mform_id . '{{ par_name }}_type"]' => array(
                  array('value' => '{{ element }}')
                )
              {% endif %}
            )
          ),
          {% endif %}
          '#attributes' => array(
            {% if element == 'url' or element == 'file' %}
            'name' => $mform_id . '{{ par_name }}',
            {% else %}
            'name' => $mform_id . '{{ par_name }}_{{ element }}',
            {% endif %}
          ),
          {% if element == 'type' %}
          '#options' => array(
            'file' => t('Upload a file'),
            'url' => t('Provide a URL')
          ),
            {% if 'http://odahub.io/ontology#FileURL' in par_detail['owl_uri'] %}
          '#default_value' => 'url',
            {% else %}
          '#default_value' => 'file',
            {% endif %}
          {% endif %}
          '#parent_classes' => array(
            'form-group',
            'col-md-8'
          ),
          '#prefix' => '<div class="row">',
          '#suffix' => '</div>'
      );
    {% endfor %}
  {% else %}
      $form['{{ par_name }}'] = array(
        {% if par_detail['value'].__class__.__name__ == 'bool' %}
        '#type' => 'radios',
        '#options' => array(
          1 => 'True',
          0 => 'False'
        ),
        {% elif 'restrictions' in par_detail and par_detail['restrictions']['allowed_values'] is defined %}
        '#type' => 'select',
        '#options' => array(
          {% for val in par_detail['restrictions']['allowed_values'] %}
          '{{ val }}' => '{{ val }}',
          {% endfor %}
        ),
        {% elif 'http://odahub.io/ontology#LongString' in par_detail['owl_uri'] %}
        '#type' => 'textarea',
        '#cols' => 100,
        '#rows' => 5,
        {% else %}
        '#type' => 'textfield',
        {% endif %}
        '#title' => t("{{ par_name }}"),
        '#default_value' => $instrument_defaults['{{ par_name }}'],
        {% if par_detail.units and par_detail.units != 'str' %}
        '#field_suffix' => t("{{ par_detail.units }}"),
        {% endif %}
        {% if 'products' in par_detail %}
          '#states' => array(
            {% set ns = namespace(prod_sets = []) %}
            {% for x in par_detail.products %}
            {% set ns.prod_sets = ns.prod_sets + ["array('value' => '%s')" % x] %}
            {% endfor %}
            'visible' => array(
              ':input[name="' . $mform_id . 'product_type"]' => array(
                {{ ", 'or', ".join(ns.prod_sets) }}
              ),
            ),
            'enabled' => array(
              ':input[name="' . $mform_id . 'product_type"]' => array(
                {{ ", 'or', ".join(ns.prod_sets) }}
              ),
            )
          ),
        {% endif %}
        '#attributes' => array(
          'name' => $mform_id . '{{ par_name }}',

          {% if 'http://odahub.io/ontology#LongString' in par_detail['owl_uri'] %}
              'maxlength' => '10000',
              'class' => array(
                  'form-control'
              )
          {% endif %}

          {% if 'restrictions' in par_detail %}
              {% if par_detail['restrictions']['min_value'] is defined and par_detail['restrictions']['max_value'] is defined %}
              'data-bv-between-max' => '{{ par_detail['restrictions']['max_value'] }}',
              'data-bv-between-min' => '{{ par_detail['restrictions']['min_value'] }}',
              'data-bv-between' => 'true',

              {% elif par_detail['restrictions']['min_value'] is defined %}
              'data-bv-greaterthan-value' => '{{ par_detail['restrictions']['min_value'] }}',
              'data-bv-greaterthan' => 'true',

              {% elif par_detail['restrictions']['max_value'] is defined %}
              'data-bv-lessthan-value' => '{{ par_detail['restrictions']['max_value'] }}',
              'data-bv-lessthan' => 'true',

              {% endif %}
          {% endif %}
        ),
        '#parent_classes' => array(
          'form-group',
          {% if 'http://odahub.io/ontology#LongString' in par_detail['owl_uri'] %}'col-md-12'
          {% elif 'http://odahub.io/ontology#FileReference' in par_detail['owl_uri'] %}'col-md-8'{% else %}
          'col-md-6'{% endif %}
        ),
        '#label_classes' => array(
          'control-label'
        ),
        '#prefix' => '<div class="row">',
        '#suffix' => '</div>'
      );
    {% endif %}
{%- endmacro %}
<?php

/**
 * @file
 * Provides a block displaying prayer times for the visitor's location
 */

/**
 */
function mmoda_{{ frontend_name }}($form, &$form_state)
{
  $form = array();

  $form['#tree'] = FALSE;
  // turn off form caching
  $mform_id = __FUNCTION__ . '_';

  $form['#action'] = '{{ form_dispatcher_url }}';
  $form['#method'] = 'POST';
  $form['#attributes'] = array(
    'class' => '{{ frontend_name }}-form'
  );

  $form['instrument'] = array(
    '#type' => 'hidden',
    '#value' => '{{ dispatcher_name }}',
    '#attributes' => array(
      'integral_instrument' => 'false',
      'support_return_progress' => 'true'
    )
  );

  $mmoda_settings = variable_get('mmoda_settings');
  $instrument_defaults = $mmoda_settings['instruments']['{{ frontend_name }}'];

  $form['query_type'] = array(
    '#type' => 'hidden',
    '#value' => $instrument_defaults['query_type'],
  );

  {% for par_name, par_detail in param_dict.items() if par_detail['in_instr_query'] %}
    {{ formfield(par_name, par_detail) }}
  {% endfor %}

  $form['product_type'] = array(
    '#type' => 'radios',
    '#title' => t("Product Type"),
    '#description' => t("Select product type"),
    '#attributes' => array(
      'name' => $mform_id . 'product_type'
    ),
    '#default_value' => $instrument_defaults['product_type'],
    '#options' => array(
      {% for prod in products_list %}
      '{{ prod }}' => '{{ prod|replace("_"," ")|capitalize }}',
      {% endfor %}
    ),
    '#parent_classes' => array(
      'form-group',
      'col-md-6'
    ),
    '#label_classes' => array(
      'control-label'
    ),
    '#prefix' => '<hr class="hr-default" /><div class="row">',
    '#suffix' => '</div><hr class="hr-default" />'
  );

  {% for par_name, par_detail in param_dict.items() if not par_detail['in_instr_query'] %}
    {% if euclid_table_parname is not none and par_name == euclid_table_parname %}
      {{ euclid_form_field(par_name) }}
    {% else %}
      {{ formfield(par_name, par_detail) }}
    {% endif %}
  {% endfor %}

  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Submit'),
    '#prefix' => '<hr class="hr-default" />'
  );

  form_load_include($form_state, 'inc', 'mmoda', 'mmoda.{{ frontend_name }}');

  return ($form);
}