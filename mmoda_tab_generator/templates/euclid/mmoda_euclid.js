(function($) {
    $(document).ready(commonReady);

    // flux and mag
    var str_flux = ['mag', 'fl', 'flux'];
    var str_err = ['e', 'mag', 'em', 'emag', 'ef', 'efl', 'err', 'error', 'e_', '_e'];
    // keys for the column params
    var keys_MW_EBV = ['e', 'e_', 'b', 'v', 'mw', 'gal', 'b_', 'ebv', 'b-v'];
    var keys_RA = ['coo', 'ra', 'rig', 'asc'];
    var keys_DEC = ['coo', 'de', 'dec', 'decl'];
    var keys_NZ_Prior_I = ['i', 'mag', 'f', 'fl', 'flux', '_i', 'i_', '.i', 'i.'];
    var keys_Ztrue = ['z', '_z', 'z_', '.z', 'z.', 'ref', 'sp', 'spe', 'spec'];

    var photo_z_instrument_form_validator = {
        validators: {
            notEmpty: {
                message: 'Mandatory parameter if Redshift prior is selected'
            }
        }
    };

    function getFile(file_path, clicked_component=null, text_confimation=null) {
        return fetch(file_path)
            .then((response) => {
                if (clicked_component !== null) {
                    clicked_component.siblings('i').hide();
                    clicked_component.show();
                }
                if (text_confimation !== null)
                    text_confimation.text('File loaded successfully');
                if (!response.ok) {
                    throw new Error(`Error during the loading of the fits file, status = ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .then((buffer) => readFile(buffer))
            .catch((error) => {
                if (clicked_component !== null) {
                    clicked_component.siblings('i').hide();
                    clicked_component.show();
                }
                if (text_confimation !== null)
                    text_confimation.text('Error in loading the file');
                console.error('Error fetching or reading file:', error);
            });
    }

    function readFile(arrayBuffer) {
        //FITS file object containing the file headers and data units
        //Library entry point expects a FITS file array buffer
	    let fits_file = window.FITSReader.parseFITS(arrayBuffer);

        //Position of the header and data unit
        let hdu_index = 1;
	    let hdu = fits_file.getHDU(hdu_index);
        if(hdu != null) {
            let data = hdu.data;

            let selector_container = document.querySelectorAll('.euclid-instruments-filters.multivalued-field');

            selector_container[0].addEventListener('change', function(event) {
                let selector_filter = event.target;
                if (selector_filter.parentElement.classList.contains("instrument-filters")) {
                    let selected_filter = event.target.value.toLowerCase();
                    let divBlock = selector_filter.closest('div.row.form-group.multivalued-value');
                    let selector_filter_flux = divBlock.querySelector('[id$="flux-"]');
                    let selector_filter_flux_error = divBlock.querySelector('[id$="flux-error-"]');

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
                    let list_columns_errors_ordered = guess_columns(data.columns, adapted_str_err);

                    selector_filter_flux.innerHTML = [{value: '', text: '- Select -'}].concat(list_columns_names_ordered.map(column => ({value: column, text: column}))).map(option => `<option value="${option.value}"${option.text === '- Select -' ? ' selected="selected"' : ''}>${option.text}</option>`).join('');
                    selector_filter_flux_error.innerHTML = [{value: '', text: '- Select -'}].concat(list_columns_errors_ordered.map(column => ({value: column, text: column}))).map(option => `<option value="${option.value}"${option.text === '- Select -' ? ' selected="selected"' : ''}>${option.text}</option>`).join('');
                }
            });

            updateSelectorList("mmoda_photoz_euclid_column_name_MW_EBV", keys_MW_EBV, data.columns);
            updateSelectorList("mmoda_photoz_euclid_column_name_RA", keys_RA, data.columns);
            updateSelectorList("mmoda_photoz_euclid_column_name_DEC", keys_DEC, data.columns);
            updateSelectorList("mmoda_photoz_euclid_column_name_Ztrue", keys_Ztrue, data.columns);
            updateSelectorList("mmoda_photoz_euclid_column_name_Nz_prior_I", keys_NZ_Prior_I, data.columns);
        }
        else
            console.error(`Error: HDU not found at the index ${hdu_index}`);

    }

    function updateSelectorList(selectorName, keys, cols) {
        let input_selector = document.querySelector(`[name="${selectorName}"]`);
        if (input_selector !== null) {
            let select_selector = $('<select class="form-control from-select"></select>');
            $.each(input_selector.attributes, function(index, attribute) {
                if (attribute.name === 'name' || attribute.name === 'id')
                    select_selector.attr(attribute.name, attribute.value);
            });
            input_selector.replaceWith(select_selector[0]);
            let list_columns_names = guess_columns(cols, keys, true);
            select_selector[0].innerHTML = []
                .concat(list_columns_names.map(column => ({value: column, text: column})))
                .map(option => `<option value="${option.value}"${option.text === '' ? ' selected="selected"' : ''}>${option.text}</option>`)
                .join('');

            if(selectorName === 'mmoda_photoz_euclid_column_name_Nz_prior_I') {
                let bootstrapValidator = $('.photoz_euclid-form.bv-form').data('bootstrapValidator');
                bootstrapValidator.addField('mmoda_photoz_euclid_column_name_Nz_prior_I', photo_z_instrument_form_validator);
                let priors_select_value = $('.form-item-priors select').val();
                if(priors_select_value === 'Redshift')
                    bootstrapValidator.enableFieldValidators('mmoda_photoz_euclid_column_name_Nz_prior_I', true);
                else
                    bootstrapValidator.enableFieldValidators('mmoda_photoz_euclid_column_name_Nz_prior_I', false);
            }
        }
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
        // add the reload button for the fits file
        let instrument_filters_selector = document.querySelectorAll('.euclid-instruments-filters');
        if(instrument_filters_selector.length > 0)
            var id_container = instrument_filters_selector[0].parentElement.id;
        if(typeof(id_container) !== 'undefined' && id_container !== "") {
            let file_url_textfield = $(`#${id_container} .form-type-textfield`);
            if(file_url_textfield.length > 0) {
                let reload_fits_button = $('<div>').addClass('btn btn-secondary button-refresh-url').attr('title', 'Reload fits file with the given URL')
                                        .append($('<span>').addClass('glyphicon glyphicon-refresh'))
                                        .append($('<i>').addClass('fa fa-spinner fa-spin').hide());
                let reload_fits_label_confirmation = $('<div>').addClass('confirmation-refresh-url-container')
                                        .append($('<span>').addClass('confirmation-msg-refresh-url'));
                reload_fits_button.on('click', reload_fits_button_click);
                let file_url_textfield_input = file_url_textfield.children('input');
                let container_textfield_and_button = $('<div>').addClass('fits-url-container').append(file_url_textfield_input[0]).append(reload_fits_button[0]);
                file_url_textfield.append(container_textfield_and_button[0]);
                file_url_textfield.append(reload_fits_label_confirmation[0]);
            }
            let file_input = document.querySelectorAll(`#${id_container} .form-type-file input`);

            if(file_input.length > 0)
                file_input[0].addEventListener('change', function(event) {
                    let file = event.target.files[0];
                    file.arrayBuffer().then(arrayBuffer => {
                        readFile(arrayBuffer);
                    }).catch(error => {
                        console.error('Error reading file as ArrayBuffer:', error);
                    });
                });
        }

        let bootstrapValidator = $('.photoz_euclid-form.bv-form').data('bootstrapValidator');
        bootstrapValidator.addField('mmoda_photoz_euclid_column_name_Nz_prior_I', photo_z_instrument_form_validator);
        // to be activated for when the page loads the first time
        let priors_select_value = $('.form-item-priors select').val();
        if(priors_select_value === 'Redshift')
            bootstrapValidator.enableFieldValidators('mmoda_photoz_euclid_column_name_Nz_prior_I', true);
        else
            bootstrapValidator.enableFieldValidators('mmoda_photoz_euclid_column_name_Nz_prior_I', false);

        let priors_select = $('.form-item-priors select');
        if (priors_select.length > 0) {
            priors_select[0].addEventListener('change', function(event) {
                let priors_select_value = event.target.value;
                let bootstrapValidator = $('.photoz_euclid-form.bv-form').data('bootstrapValidator');
                bootstrapValidator.enableFieldValidators('mmoda_photoz_euclid_column_name_Nz_prior_I', true);
                if(priors_select_value !== 'Redshift')
                    bootstrapValidator.enableFieldValidators('mmoda_photoz_euclid_column_name_Nz_prior_I', false);
            });
        }
    }

    function AJAX_call_get_token() {
        return $.ajax({
          url: 'get_token',
        });
    }

    function reload_fits_button_click(event) {
        let refresh_button = $('.button-refresh-url');
        let refresh_button_spinner = $('.button-refresh-url span');
        refresh_button_spinner.hide();
        refresh_button_spinner.siblings('i').show();
        let text_confimation_span = $('.confirmation-msg-refresh-url');
        text_confimation_span.text('');
        let fits_file_url = refresh_button.siblings('input').val();

        AJAX_call_get_token().done(
            function(data, textStatus, jqXHR) {
                if (data.hasOwnProperty('token') && data.token !== null && data.token !== undefined && data.token !== '') {
                    let token = data.token;
                    parameters = {"fits_file_url": fits_file_url, "token": token};
                    let url_request = 'dispatch-data/load_frontend_fits_file_url?' + $.param(parameters);
                    getFile(url_request, refresh_button_spinner, text_confimation_span);
                }
            }
        ).error(function(jqXHR, textStatus, errorThrown) {
            console.log('Error in requesting the user token:');
            console.log('textStatus : ' + textStatus);
            console.log('errorThrown :' + errorThrown);
            console.log('jqXHR');
            console.log(jqXHR);
        });
    }

})(jQuery);