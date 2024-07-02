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

    function readFile(arrayBuffer, id_selector) {
        //FITS file object containing the file headers and data units
        //Library entry point expects a FITS file array buffer
	    let fits_file = window.FITSReader.parseFITS(arrayBuffer);

        //Position of the header and data unit
        let hdu_index = 1;

	    let hdu = fits_file.getHDU(hdu_index);

	    let header = hdu.header;
	    let data = hdu.data;

        let card_name = "CARDNAME";

//	    //Get a specific card value
//	    let card_value = header.get(card_name);
//
//	    let col_name = "column";
//
//	    //Specific to BINTABLE and TABLE extension
//	    let col_data;
//	    data.getColumn(col_name, function(col){col_data = col});

        col_order = guess_columns(data.columns, ['z', 'z', 'z', '.z', 'z.', 'ref', 'sp', 'spe', 'spec'], true);

        let select_filter_flux = document.getElementById(id_selector.replace("file", "flux-"));
        select_filter_flux.innerHTML = [{value: '', text: '- Select -'}].concat(data.columns.map(column => ({value: column, text: column}))).map(option => `<option value="${option.value}"${option.text === '- Select -' ? ' selected="selected"' : ''}>${option.text}</option>`).join('');
        let select_filter_flux_error = document.getElementById(id_selector.replace("file", "flux-error-"));
        select_filter_flux_error.innerHTML = [{value: '', text: '- Select -'}].concat(data.columns.map(column => ({value: column, text: column}))).map(option => `<option value="${option.value}"${option.text === '- Select -' ? ' selected="selected"' : ''}>${option.text}</option>`).join('');
    }

    function guess_columns(cols, keys=[], empty=false) {
        let col_order = structuredClone(cols);
        for (let k of keys) {
            let idx = Array.from({length: col_order.length}, (_, i) => i);
            idx_found = [];
            for (c of col_order){
                if(c.toLowerCase().indexOf(k) !== -1)
                    idx_found.push(col_order.indexOf(c));
            }
            idx = idx.filter((_, i) => !idx_found.includes(i));
            idx = idx_found.concat(idx);
            col_order = idx.map(i => col_order[i]);
        }

        if(col_order.length != cols.length){
            console.error("Error: miss columns");
        }
        if (empty)
            col_order.unshift('');

        return col_order;
    }

    function commonReady() {
        let file_input = document.querySelectorAll('.euclid-instruments-filters.fits-file-container input');
        file_input[0].addEventListener('change', function(event) {
            let file = event.target.files[0];
            let id_selector = event.target.id;
            let name_selector = event.target.name;
            file.arrayBuffer().then(arrayBuffer => {
                readFile(arrayBuffer, id_selector);
            }).catch(error => {
                console.error('Error reading file as ArrayBuffer:', error);
            });
        });
    }
})(jQuery);