<?php

/**
 * @file
 * Provides a block displaying prayer times for the visitor's location
 */

/**
 */
function mmoda_{{ instrument_name }}($form, &$form_state)
{
  $form = array();

  $form['#tree'] = FALSE;
  // turn off form caching
  $mform_id = __FUNCTION__ . '_';

  $form['#action'] = 'dispatch-data/run_analysis';
  $form['#method'] = 'POST';
  $form['#attributes'] = array(
    'class' => '{{ instrument_name }}-form'
  );

  $form['instrument'] = array(
    '#type' => 'hidden',
    '#value' => '{{ instrument_name }}'
  );

  $mmoda_settings = variable_get('mmoda_settings');
  $instrument_defaults = $mmoda_settings['instruments']['{{ instrument_name }}'];

  $form['query_type'] = array(
    '#type' => 'hidden',
    '#value' => $instrument_defaults['query_type'],
  );

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
    '#prefix' => '<div class="row">',
    '#suffix' => '</div><hr class="hr-default" />'
  );

  {% for par_name, par_detail in param_dict.items() %}
  
  $form['{{ par_name }}'] = array(
    {% if par_detail['value'].__class__.__name__ == 'bool' %}
    '#type' => 'radios',
    '#options' => array(
      True => 'True',
      False => 'False'
    ),
    {% elif 'restrictions' in par_detail and par_detail['restrictions'].get('allowed_values', []) %}
    '#type' => 'select',
    '#options' => array(
      {% for val in par_detail['restrictions']['allowed_values'] %}
      '{{ val }}' => '{{ val }}',
      {% endfor %}
    ),    
    {% else %}
    '#type' => 'textfield',
    {% endif %}
    '#title' => t("{{ par_name }}"),
    '#default_value' => $instrument_defaults['{{ par_name }}'],
    {% if par_detail.units %}
    '#field_suffix' => t("{{ par_detail.units }}"),
    {% endif %}
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
    '#attributes' => array(
      'name' => $mform_id . '{{ par_name }}',

      {% if 'restrictions' in par_detail and par_detail['restrictions'].get('min_value', None) and par_detail['restrictions'].get('max_value', None) %}
      'data-bv-between-max' => '{{ par_detail['restrictions']['max_value'] }}',
      'data-bv-between-min' => '{{ par_detail['restrictions']['min_value'] }}',
      
      {% elif 'restrictions' in par_detail and par_detail['restrictions'].get('min_value', None) %}
      'data-bv-greaterthan-value' => '{{ par_detail['restrictions']['min_value'] }}',
    
      {% elif 'restrictions' in par_detail  and par_detail['restrictions'].get('max_value', None) %}
      'data-bv-lessthan-value' => '{{ par_detail['restrictions']['max_value'] }}',

      {% endif %}
    ),
    '#parent_classes' => array(
      'form-group',
      'col-md-6'
    ),
    '#label_classes' => array(
      'control-label'
    ),
    '#prefix' => '<div class="row">',
    '#suffix' => '</div>'
  );

  {% endfor %}

  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Submit'),
    '#prefix' => '<hr class="hr-default" />'
  );

  form_load_include($form_state, 'inc', 'mmoda', 'mmoda.{{ instrument_name }}');

  return ($form);
}
