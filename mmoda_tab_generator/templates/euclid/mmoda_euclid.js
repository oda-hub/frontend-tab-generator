(function($) {
    $(document).ready(commonReady);

    // flux and mag
    var str_flux = ['mag', 'fl', 'flux']
    var str_err = ['e', 'mag', 'em', 'emag', 'ef', 'efl', 'err', 'error', 'e_', '_e']

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


        // let keys = ['f', 'r', 'flux', '_r', 'hsc'];
        // let col_order = structuredClone(data.columns);
        // for (let k of keys) {
        //     let idx = Array.from({length: col_order.length}, (_, i) => i);
        //     idx_found = [];
        //     for (c of col_order){
        //         if(c.toLowerCase().indexOf(k) !== -1)
        //             idx_found.push(col_order.indexOf(c));
        //     }
        //     idx = idx.filter((_, i) => !idx_found.includes(i));
        //     idx = idx_found.concat(idx);
        //     col_order = idx.map(i => col_order[i]);
        // }

        // if(col_order.length != data.columns.length){
        //     console.error("Error: miss columns");
        // }

        // col_order.unshift('');
        // col_order = guess_columns(data.columns, ['z', 'z', 'z', '.z', 'z.', 'ref', 'sp', 'spe', 'spec'], true);

        // select_filter_flux.innerHTML = [{value: '', text: '- Select -'}].concat(col_order.map(column => ({value: column, text: column}))).map(option => `<option value="${option.value}"${option.text === '- Select -' ? ' selected="selected"' : ''}>${option.text}</option>`).join('');


        // select_filter_flux_error.innerHTML = [{value: '', text: '- Select -'}].concat(col_order.map(column => ({value: column, text: column}))).map(option => `<option value="${option.value}"${option.text === '- Select -' ? ' selected="selected"' : ''}>${option.text}</option>`).join('');

        // let column_name_Nz_prior_I_input = document.querySelectorAll('.form-item-column-name-Nz-prior-I select');
        let selector_container = document.querySelectorAll('.euclid-instruments-filters.multivalued-field');

        selector_container[0].addEventListener('change', function(event) {
            let selector_filter = event.target;
            let selected_filter = event.target.value.toLowerCase();
            let divBlock = selector_filter.closest('div.row.form-group.multivalued-value');
            let selector_filter_flux = divBlock.querySelector('[id$="flux-"]');
            let selector_filter_flux_error = divBlock.querySelector('[id$="flux-error-"]');
            console.log("selected: " + selected_filter);

            f0 = selected_filter.split('|')[0]
            f1 = selected_filter.split('|')[1]
            f2 = f1.split('.')[1]
            f1 = f1.split('.')[0]

            let adapted_str_flux = str_flux.slice();
            adapted_str_flux.push('_' + f2, f2 + '_', '.' + f2, f2 + '.', f0, f1, 'mag_' + f1, 'f' + f1);
            adapted_str_flux.unshift(f2);

            let adapted_str_err = str_err.slice();
            adapted_str_err.push('_' + f2, f2 + '_', '.' + f2, f2 + '.', f0, f1, 'emag_' + f1, 'e' + f1, 'ef' + f1);
            adapted_str_err.unshift(f2);

            let list_columns_names_ordered = guess_columns(data.columns, adapted_str_flux);
            let list_comun_errors_ordered = guess_columns(data.columns, adapted_str_err);

            selector_filter_flux.innerHTML = [{value: '', text: '- Select -'}].concat(list_columns_names_ordered.map(column => ({value: column, text: column}))).map(option => `<option value="${option.value}"${option.text === '- Select -' ? ' selected="selected"' : ''}>${option.text}</option>`).join('');
            selector_filter_flux_error.innerHTML = [{value: '', text: '- Select -'}].concat(list_comun_errors_ordered.map(column => ({value: column, text: column}))).map(option => `<option value="${option.value}"${option.text === '- Select -' ? ' selected="selected"' : ''}>${option.text}</option>`).join('');
        });
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