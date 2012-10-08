angular.module('StarcounterLib', [])
  .directive('uiDatagrid', function () {
    var directiveDefinitionObject = {
      restrict: 'A',
      compile: function compile(tElement, tAttrs, transclude) {

        var defaultSettings = {
          rows: 6,
          cols: 3,
          outsideClickDeselects: false,
          autoComplete: []
        };

        var $container = $('<div class="dataTable"></div>');

        return function postLink(scope, element, attrs, controller) {
          var expression = attrs.datarows;
          var match = expression.match(/^\s*(.+)\s+in\s+(.*)\s*$/),
            lhs, rhs, valueIdent, keyIdent;
          if (!match) {
            throw Error("Expected datarows in form of '_item_ in _collection_' but got '" +
              expression + "'.");
          }
          lhs = match[1];
          rhs = match[2];

          $(element).append($container);

          var settings = angular.extend({}, defaultSettings, scope.$eval(attrs.uiDatagrid));
          var columns = [];
          var colHeaders = [];

          $(element).find('datacolumn').each(function (index) {
            var pattern = new RegExp("^(" + lhs + "\\.)");
            var value = $(this).attr('value').replace(pattern, '');
            var title = $(this).attr('title');
            var type = $(this).attr('type');
            var options = $(this).attr('options');

            var column = {
              data: value
            };

            colHeaders.push(title);

            if (type === 'autocomplete') {
              settings['autoComplete'].push({
                match: function (row, col) {
                  if (col === index) {
                    return true;
                  }
                },
                source: function (row, col) {
                  var childScope = scope.$new();
                  childScope.item = $container.data('handsontable').getData()[row];
                  var parsed = childScope.$eval(options);
                  return parsed;
                }
              })
            }
            else if (type === 'checkbox') {
              column.renderer = Handsontable.CheckboxRenderer;
              column.rendererOptions = scope.$eval(options);
              column.editor = Handsontable.CheckboxEditor;
              column.editorOptions = scope.$eval(options);
            }

            columns.push(column);
          });

          if (columns.length > 0) {
            settings['columns'] = columns;
          }

          if (colHeaders.length > 0) {
            settings['colHeaders'] = colHeaders;
          }

          settings['data'] = scope[rhs];
          $container.handsontable(settings);

          $container.on('datachange.handsontable', function (event, changes, source) {
            if (source === 'loadData') {
              return;
            }
            scope.$apply(function () {
              scope.dataChange = !scope.dataChange;
            });
          });

          $container.on('selectionbyprop.handsontable', function (event, r, p, r2, p2) {
            scope.$emit('datagridSelection', $container, r, p, r2, p2);
          });

          scope.$watch('dataChange', function (value) {
            $container.handsontable("loadData", scope[rhs]);
          });
        }
      }
    };
    return directiveDefinitionObject;
  });