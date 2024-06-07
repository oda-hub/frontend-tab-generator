(function($) {
    $(document).ready(commonReady);
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
        // let hdu = fits_file.hdus[hdu_index];

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
        let file_input = document.querySelectorAll('.euclid-instruments-filters.fits-file-container input');
        file_input[0].addEventListener('change', function(event) {
            let file = event.target.files[0];
            file.arrayBuffer().then(arrayBuffer => {
                readFile(arrayBuffer);
            }).catch(error => {
                console.error('Error reading file as ArrayBuffer:', error);
            });
        });
    }
})(jQuery);