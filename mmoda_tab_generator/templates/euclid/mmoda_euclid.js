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
    function getFile(file_path) {
        return fetch(file_path)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error, status = ${response.status}`);
                }
                return response.arrayBuffer();
        }).then((buffer) => readFile(buffer));
    }

    function readFile(arrayBuffer) {
        //FITS file object containing the file headers and data units
        //Library entry point expects a FITS file array buffer
	    let fits_file = window.FITSReader.parseFITS(arrayBuffer);

        //Position of the header and data unit
        let hdu_index = 1;

	    let hdu = fits_file.getHDU(hdu_index);

	    let header = hdu.header;
	    let data = hdu.data;

        let card_name = "CARDNAME";

	    //Get a specific card value
	    let card_value = header.get(card_name);

	    let col_name = "column";

	    //Specific to BINTABLE and TABLE extension
	    let col_data;
	    data.getColumn(col_name, function(col){col_data = col});
    }

    function commonReady() {
        $('.euclid-instruments-filters.fits-file-container input').on('change', function() {
            // let fits_reader_wrapper = new FITSReaderWrapper(file_path);
            // WrapperContainer.setFITSReaderWrapper(fits_reader_wrapper);
            let fileName = $(this).val().split('\\').pop();
            // console.log(fileName);
            getFile(fileName);
        });

    }
})(jQuery);
