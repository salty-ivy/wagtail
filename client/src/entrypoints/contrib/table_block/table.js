/* eslint-disable func-names, dot-notation */

/* global Handsontable */

import $ from 'jquery';
import { hasOwn } from '../../../utils/hasOwn';

function initTable(id, tableOptions) {
  const containerId = id + '-handsontable-container';
  // const tableHeaderCheckboxId = id + '-handsontable-header';
  // const colHeaderCheckboxId = id + '-handsontable-col-header';
  var tableHeaderId = id + '-handsontable-header';
  var colHeaderId = id + '-handsontable-col-header';
  var headerChoiceId = id + '-table-header-choice';
  const tableCaptionId = id + '-handsontable-col-caption';
  const hiddenStreamInput = $('#' + id);
  // const tableHeaderCheckbox = $('#' + tableHeaderCheckboxId);
  // const colHeaderCheckbox = $('#' + colHeaderCheckboxId);
  var tableHeader = $('#' + tableHeaderId);
  var colHeader = $('#' + colHeaderId);
  var headerChoice = $('#' + headerChoiceId);
  const tableCaption = $('#' + tableCaptionId);
  const finalOptions = {};
  let hot = null;
  let dataForForm = null;
  let isInitialized = false;

  const getWidth = function () {
    return $('.w-field--table_input').closest('.sequence-member-inner').width();
  };
  const getHeight = function () {
    const tableParent = $('#' + id).parent();
    return tableParent.find('.htCore').height();
    // return (
    //   tableParent.find('.htCore').height() +
    //   tableParent.find('[data-field]').height() * 2
    // );
  };
  const resizeTargets = [
    '[data-field] > .handsontable',
    '.wtHider',
    '.wtHolder',
  ];
  const resizeHeight = function (height) {
    const currTable = $('#' + id);
    $.each(resizeTargets, function () {
      currTable.closest('[data-field]').find(this).height(height);
    });
  };
  function resizeWidth(width) {
    $.each(resizeTargets, function () {
      $(this).width(width);
    });
    const $field = $('.w-field--table_input');
    $field.width(width);
  }

  try {
    dataForForm = JSON.parse(hiddenStreamInput.val());
  } catch (e) {
    // do nothing
  }

  if (dataForForm !== null) {
    // if (hasOwn(dataForForm, 'first_row_is_table_header')) {
    //   tableHeaderCheckbox.prop(
    //     'checked',
    //     dataForForm.first_row_is_table_header,
    //   );
    // }
    // if (hasOwn(dataForForm, 'first_col_is_header')) {
    //   colHeaderCheckbox.prop('checked', dataForForm.first_col_is_header);
    // }
    if (hasOwn(dataForForm, 'table_header_choice')) {
      headerChoice.prop('value', dataForForm.table_header_choice);
    }
    if (hasOwn(dataForForm, 'table_caption')) {
      tableCaption.prop('value', dataForForm.table_caption);
    }
  }

  if (hasOwn(!tableOptions, 'width') || hasOwn(!tableOptions, 'height')) {
    // Size to parent .sequence-member-inner width if width is not given in tableOptions
    $(window).on('resize', () => {
      hot.updateSettings({
        width: getWidth(),
        height: getHeight(),
      });
      resizeWidth('100%');
    });
  }

  const getCellsClassnames = function () {
    const meta = hot.getCellsMeta();
    const cellsClassnames = [];
    for (let i = 0; i < meta.length; i += 1) {
      if (hasOwn(meta[i], 'className')) {
        cellsClassnames.push({
          row: meta[i].row,
          col: meta[i].col,
          className: meta[i].className,
        });
      }
    }
    return cellsClassnames;
  };

  const persist = function () {
    hiddenStreamInput.val(
      JSON.stringify({
        data: hot.getData(),
        cell: getCellsClassnames(),
        // first_row_is_table_header: tableHeaderCheckbox.prop('checked'),
        // first_col_is_header: colHeaderCheckbox.prop('checked'),
        first_row_is_table_header: tableHeader.val(),
        first_col_is_header: colHeader.val(),
        table_header_choice: headerChoice.val(),
        table_caption: tableCaption.val(),
      }),
    );
  };

  const cellEvent = function (change, source) {
    if (source === 'loadData') {
      return; // don't save this change
    }

    persist();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const metaEvent = function (row, column, key, value) {
    if (isInitialized && key === 'className') {
      persist();
    }
  };

  const initEvent = function () {
    isInitialized = true;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const structureEvent = function (index, amount) {
    resizeHeight(getHeight());
    persist();
  };

  // tableHeaderCheckbox.on('change', () => {
  //   persist();
  // });

  // colHeaderCheckbox.on('change', () => {
  //   persist();
  // });
  headerChoice.on('change', () => {
    persist();
  });

  tableCaption.on('change', () => {
    persist();
  });

  const defaultOptions = {
    afterChange: cellEvent,
    afterCreateCol: structureEvent,
    afterCreateRow: structureEvent,
    afterRemoveCol: structureEvent,
    afterRemoveRow: structureEvent,
    afterSetCellMeta: metaEvent,
    afterInit: initEvent,
    // contextMenu set via init, from server defaults
  };

  if (dataForForm !== null) {
    // Overrides default value from tableOptions (if given) with value from database
    if (hasOwn(dataForForm, 'data')) {
      defaultOptions.data = dataForForm.data;
    }
    if (hasOwn(dataForForm, 'cell')) {
      defaultOptions.cell = dataForForm.cell;
    }
  }

  Object.keys(defaultOptions).forEach((key) => {
    finalOptions[key] = defaultOptions[key];
  });
  Object.keys(tableOptions).forEach((key) => {
    finalOptions[key] = tableOptions[key];
  });

  hot = new Handsontable(document.getElementById(containerId), finalOptions);
  hot.render(); // Call to render removes 'null' literals from empty cells

  // Apply resize after document is finished loading (parent .sequence-member-inner width is set)
  if ('resize' in $(window)) {
    resizeHeight(getHeight());
    $(window).on('load', () => {
      $(window).trigger('resize');
    });
  }
}
window.initTable = initTable;

class TableInput {
  constructor(options, strings) {
    this.options = options;
    this.strings = strings;
  }

  render(placeholder, name, id, initialState) {
    const container = document.createElement('div');
    container.innerHTML = `
      <div className="w-field__wrapper" data-field-wrapper>
        <label for="${id}-table-header-choice">${this.strings['Table headers']}</label>
        <div class="w-field w-field--boolean_field w-field--checkbox_input" data-field>
          <div className="w-field__input" data-field-input>
            <select id="${id}-table-header-choice" name="table-header-choice">
              <option value="">Select a header option</option>
              <option value="row">
                  Display the first row as a header
              </option>
              <option value="column">
                  Display the first column as a header
              </option>
              <option value="both">
                  Display the first row AND first column as headers
              </option>
              <option value="neither">
                  No headers
              </option>
            </select>
            <p class="help">Which cells should be displayed as headers?</p>
          </div>
        </div>
      </div>

      <div className="w-field__wrapper" data-field-wrapper>
        <label class="w-field__label" for="${id}-handsontable-col-caption">${this.strings['Table caption']}</label>
        <div class="w-field w-field--char_field w-field--text_input" data-field>
          <div className="w-field__input" data-field-input>
            <input type="text" id="${id}-handsontable-col-caption" name="handsontable-col-caption" aria-describedby="${id}-handsontable-col-caption-helptext" />
          </div>
          <div id="${id}-handsontable-col-caption-helptext" data-field-help>
            <div class="help">${this.strings['A heading that identifies the overall topic of the table, and is useful for screen reader users']}</div>
          </div>
        </div>
      </div>
      <div id="${id}-handsontable-container"></div>
      <input type="hidden" name="${name}" id="${id}" placeholder="${this.strings['Table']}">
    `;
    placeholder.replaceWith(container);

    const input = container.querySelector(`input[name="${name}"]`);
    const options = this.options;

    const widget = {
      getValue() {
        return JSON.parse(input.value);
      },
      getState() {
        return JSON.parse(input.value);
      },
      setState(state) {
        input.value = JSON.stringify(state);
        initTable(id, options);
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      focus() {},
    };
    widget.setState(initialState);
    return widget;
  }
}
window.telepath.register('wagtail.widgets.TableInput', TableInput);
