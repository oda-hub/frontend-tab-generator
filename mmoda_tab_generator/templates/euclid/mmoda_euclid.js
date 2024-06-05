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
        $('.euclid-instruments-filters.fits-file-container input').on('change', function() {
            // let fits_reader_wrapper = new FITSReaderWrapper(file_path);
            // WrapperContainer.setFITSReaderWrapper(fits_reader_wrapper);
            let fileName = $(this).val().split('\\').pop();
            console.log(fileName);
        });
    }
})(jQuery);

