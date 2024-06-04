{% from 'euclid/macros.j2' import euclid_form_field %}
(function($) {
    $(document).ready(commonReady);
    // let fits_reader_wrapper = new FITSReaderWrapper();

    // let bokeh_wrapper = new BokehWrapper();

    // let d3_wrapper = new D3Wrapper();

    // WrapperContainer.setBokehWrapper(bokeh_wrapper);
    // WrapperContainer.setD3Wrapper(d3_wrapper);

    // VisualizationContainer.setBokehVisualization(new BokehGraph());
    // VisualizationContainer.setD3Visualization(new D3Graph());

    // customElements.define('file-component', FileComponent);
    // customElements.define('settings-component', SettingsComponent);
    // customElements.define('visualization-component', VisualizationComponent);
    // customElements.define('fits-component', FITSSettingsComponent);
    // customElements.define('csv-component', CSVSettingsComponent);
    function commonReady() {
    {% for par_name, par_detail in param_dict.items() if not par_detail['in_instr_query'] %}
        {% if euclid_table_parname is not none and par_name == euclid_table_parname %}
        $('#edit-{{ par_name }}-fits-file').on('change', function() {
        // let fits_reader_wrapper = new FITSReaderWrapper(file_path);
        // WrapperContainer.setFITSReaderWrapper(fits_reader_wrapper);
        });
        {% endif %}
    {% endfor %}
    }
})(jQuery);

