(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
       Event = YAHOO.util.Event,
       Selector = YAHOO.util.Selector,
       KeyListener = YAHOO.util.KeyListener,
       Bubbling = YAHOO.Bubbling;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
      $links = Alfresco.util.activateLinks,
      $combine = Alfresco.util.combinePaths,
      $userProfile = Alfresco.util.userProfileLink;


   Alfresco.component.ExtDataGrid = function(htmlId)
   {
      Alfresco.component.ExtDataGrid.superclass.constructor.call(this, htmlId);
      YAHOO.Bubbling.on("afterFormRuntimeInit", this.onAfterFormRuntimeInit, this);
      // YAHOO.Bubbling.on("beforeFormRuntimeInit", this.onBeforeFormRuntimeInit, this);

      this.totalRecordsUpper = null;
      
      return this;
   };

   /**
    * Extend Alfresco.component.DataGrid 
    */
   YAHOO.extend(Alfresco.component.ExtDataGrid, Alfresco.component.DataGrid);
   
   /**
    * Augment prototype with Common Actions module
    */
   YAHOO.lang.augmentProto(Alfresco.component.ExtDataGrid, Alfresco.service.DataListActions);

   /**
    * Augment prototype with main class implementation, ensuring overwrite is enabled
    */
   YAHOO.lang.augmentObject(Alfresco.component.ExtDataGrid.prototype,
   {
	   
	   filterFormResponse: null,

      /*
       * Quick Hack fix for #34 (window.escape assuming Latin1 charset on FF). Calls replaced be  *URIComponent.
       */
      _setupHistoryManagers: function DataGrid__setupHistoryManagers()
      {
         /**
          * YUI History - filter
          */
         var bookmarkedFilter = YAHOO.util.History.getBookmarkedState("filter");
         bookmarkedFilter = bookmarkedFilter === null ? "all" : (YAHOO.env.ua.gecko > 0) ? bookmarkedFilter : encodeURIComponent(bookmarkedFilter);

         try
         {
            while (bookmarkedFilter != (bookmarkedFilter = decodeURIComponent(bookmarkedFilter))){}
         }
         catch (e1)
         {
            // Catch "malformed URI sequence" exception
         }

         var fnDecodeBookmarkedFilter = function DataGrid_fnDecodeBookmarkedFilter(strFilter)
         {
            var filters = strFilter.split("|"),
                filterObj =
                {
                   filterId: decodeURIComponent(filters[0] || ""),
                   filterData: decodeURIComponent(filters[1] || "")
                };

            filterObj.filterOwner = Alfresco.util.FilterManager.getOwner(filterObj.filterId);
            return filterObj;
         };

         this.options.initialFilter = fnDecodeBookmarkedFilter(bookmarkedFilter);

         // Register History Manager filter update callback
         YAHOO.util.History.register("filter", bookmarkedFilter, function DataGrid_onHistoryManagerFilterChanged(newFilter)
         {
            Alfresco.logger.debug("HistoryManager: filter changed:" + newFilter);
            // Firefox fix
            if (YAHOO.env.ua.gecko > 0)
            {
               newFilter = decodeURIComponent(newFilter);
               Alfresco.logger.debug("HistoryManager: filter (after Firefox fix):" + newFilter);
            }

            this._updateDataGrid.call(this,
                {
                   filter: fnDecodeBookmarkedFilter(newFilter)
                });
         }, null, this);


         /**
          * YUI History - page
          */
         var me = this;
         var handlePagination = function DataGrid_handlePagination(state, me)
         {
            me.widgets.paginator.setState(state);
            YAHOO.util.History.navigate("page", String(state.page));
         };

         if (this.options.usePagination)
         {
            var bookmarkedPage = YAHOO.util.History.getBookmarkedState("page") || "1";
            while (bookmarkedPage != (bookmarkedPage = decodeURIComponent(bookmarkedPage))){}
            this.currentPage = parseInt(bookmarkedPage || this.options.initialPage, 10);

            // Register History Manager page update callback
            YAHOO.util.History.register("page", bookmarkedPage, function DataGrid_onHistoryManagerPageChanged(newPage)
            {
               Alfresco.logger.debug("HistoryManager: page changed:" + newPage);
               me.widgets.paginator.setPage(parseInt(newPage, 10));
               this.currentPage = parseInt(newPage, 10);
            }, null, this);

            // YUI Paginator definition
            this.widgets.paginator = new YAHOO.widget.Paginator(
                {
                   containers: [this.id + "-paginator", this.id + "-paginatorBottom"],
                   rowsPerPage: this.options.pageSize,
                   initialPage: this.currentPage,
                   template: this.msg("pagination.template"),
                   pageReportTemplate: this.msg("pagination.template.page-report"),
                   previousPageLinkLabel: this.msg("pagination.previousPageLinkLabel"),
                   nextPageLinkLabel: this.msg("pagination.nextPageLinkLabel")
                });

            this.widgets.paginator.subscribe("changeRequest", handlePagination, this);

            // Display the bottom paginator bar
            Dom.setStyle(this.id + "-datagridBarBottom", "display", "block");
         }

         // Initialize the browser history management library
         try
         {
            YAHOO.util.History.initialize("yui-history-field", "yui-history-iframe");
         }
         catch (e2)
         {
            /*
             * The only exception that gets thrown here is when the browser is
             * not supported (Opera, or not A-grade)
             */
            Alfresco.logger.error(this.name + ": Couldn't initialize HistoryManager.", e2);
            this.onHistoryManagerReady();
         }
      },

      /**
       * Returns actions custom datacell formatter
       *
       * @method fnRenderCellActions
       */
      fnRenderCellActions: function DataGrid_fnRenderCellActions()
      {
         var scope = this;
         
         /**
          * Actions custom datacell formatter
          *
          * @method renderCellActions
          * @param elCell {object}
          * @param oRecord {object}
          * @param oColumn {object}
          * @param oData {object|string}
          */
         return function DataGrid_renderCellActions(elCell, oRecord, oColumn, oData)
         {
            Dom.setStyle(elCell, "width", "110px");
            Dom.setStyle(elCell.parentNode, "width", "110px");

            elCell.innerHTML = '<div id="' + scope.id + '-actions-' + oRecord.getId() + '" class="hidden"></div>';
         };
      },
      
      /**
       * Return data type-specific formatter
       *
       * @method getCellFormatter
       * @return {function} Function to render read-only value
       */
      getCellFormatter: function DataGrid_getCellFormatter()
      {
         var scope = this;
         
         /**
          * Data Type custom formatter
          *
          * @method renderCellDataType
          * @param elCell {object}
          * @param oRecord {object}
          * @param oColumn {object}
          * @param oData {object|string}
          */
         return function DataGrid_renderCellDataType(elCell, oRecord, oColumn, oData)
         {
            var html = "";

            // Populate potentially missing parameters
            if (!oRecord)
            {
               oRecord = this.getRecord(elCell);
            }
            if (!oColumn)
            {
               oColumn = this.getColumn(elCell.parentNode.cellIndex);
            }

            if (oRecord && oColumn)
            {
               if (!oData)
               {
                  oData = oRecord.getData("itemData")[oColumn.field];
               }
            
               if (oData)
               {
                  var datalistColumn = scope.datalistColumns[oColumn.key];
                  if (datalistColumn)
                  {
                     oData = YAHOO.lang.isArray(oData) ? oData : [oData];
                     for (var i = 0, ii = oData.length, data; i < ii; i++)
                     {
                        data = oData[i];

                        switch (datalistColumn.dataType.toLowerCase())
                        {
                           case "cm:person":
                        	   if (ii > 2 && i === 2){
                         		  html +="<span>...</span>"
                         	  }else if (i < 2){
                         		 html += '<span class="person">' + $userProfile(data.metadata, data.displayValue) + '</span>';  
                         	  }
                              break;
                        
                           case "datetime":
                              html += Alfresco.util.formatDate(Alfresco.util.fromISO8601(data.value), scope.msg("date-format.default"));
                              break;
                     
                           case "date":
                              html += Alfresco.util.formatDate(Alfresco.util.fromISO8601(data.value), scope.msg("date-format.defaultDateOnly"));
                              break;
                     
                           case "bpm:workflowpackage":
                        	   html += '<span class="workflowSubject"><a href="/share/page/workflow-details?workflowId=' + data.metadata + '">' + data.displayValue + '</a></span>';
                        	   break;

                           case "cm:content":
                           case "cm:cmobject":
                           case "cm:folder":
                        	  if (ii > 2 && i === 2){
                        		  html +="<span>...</span>"
                        	  }else if (i < 2){
                        		  if (data.linkValue){
                        			  html += '<a href="' + Alfresco.util.siteURL((data.metadata == "container" ? 'folder' : 'document') + '-details?nodeRef=' + data.linkValue) + '">';
                        		  }else{
                        			  html += '<a href="' + Alfresco.util.siteURL((data.metadata == "container" ? 'folder' : 'document') + '-details?nodeRef=' + data.value) + '">';
                        		  }
                                  html += '<img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/images/filetypes/' + Alfresco.util.getFileIcon(data.displayValue, (data.metadata == "container" ? 'cm:folder' : null), 16) + '" width="16" alt="' + $html(data.displayValue) + '" title="' + $html(data.displayValue) + '" />';
                                  html += ' ' + $html(data.displayValue) + '</a>'  
                        	  }
                              break;
                           
                           case "discussion":
                        	   html+= scope.msg("datalist.comments.count", data.displayValue);
                        	   break;
                        	   
                           case "boolean":
                               html+=  '<input type="checkbox" onclick="javascript: return false;" onkeydown="javascript: return false;"' + (data.value ? ' checked="checked">' : '>');
                               break;
                           default:
                        	  if ($html(data.displayValue.length) > 40){
                        		  html += $html(data.displayValue.substring(0,40) + '...');
                        		  var domid = Alfresco.util.generateDomId(elCell);
                        		  new YAHOO.widget.Tooltip(domid +"tooltip",  
                        				  { context:elCell,  
                        				  text:  $html(data.displayValue)});
                        	  }else{
                        		  html += $html(data.displayValue);  
                        	  }
                              
                              break;
                        }

                        if (i < ii - 1 && i <= 1)
                        {
                           html += "<br />";
                        }
                     }
                  }
               }
            }

            elCell.innerHTML = html;
         };
      },
      

      /**
       * Fired by YUI when parent element is available for scripting
       *
       * @method onReady
       */
      onReady: function ExtDataGrid_onReady()
      {
    	 Alfresco.component.ExtDataGrid.superclass.onReady.call(this);
         
         // FilterForm Submit button
         this.widgets.filterFormSubmit = Alfresco.util.createYUIButton(this, "filterform-submit", this.onFilterFormSubmit);
         this.widgets.filterFormClear = Alfresco.util.createYUIButton(this, "filterform-clear", this.onFilterFormClear);
         // FilterForm Save button..not yet
         //this.widgets.filterFormSave = Alfresco.util.createYUIButton(this, "filterform-save", this.onFilterFormSave);
         
         Alfresco.util.createTwister(this.id+"-filterHeader", "datalistformfilter");
      },
   	  
	  /**
       * Edit Data Item pop-up
       *
       * @method onActionEdit
       * @param item {object} Object literal representing one data item
       */
      onActionEdit: function DataGrid_onActionEdit(item)
      {
         var scope = this;
         
         // Intercept before dialog show
         var doBeforeDialogShow = function DataGrid_onActionEdit_doBeforeDialogShow(p_form, p_dialog)
         {
            Alfresco.util.populateHTML(
               [ p_dialog.id + "-dialogTitle", this.msg("label.edit-row.title") ]
            );

            /**
             * No full-page edit view for v3.3
             *
            // Data Item Edit Page link button
            Alfresco.util.createYUIButton(p_dialog, "editDataItem", null, 
            {
               type: "link",
               label: scope.msg("label.edit-row.edit-dataitem"),
               href: scope.getActionUrls(item).editMetadataUrl
            });
             */
         };

         var templateUrl = YAHOO.lang.substitute(Alfresco.constants.URL_SERVICECONTEXT + "components/form?itemKind={itemKind}&itemId={itemId}&mode={mode}&submitType={submitType}&showCancelButton=true",
         {
            itemKind: "node",
            itemId: item.nodeRef,
            mode: "edit",
            submitType: "json"
         });

         // Using Forms Service, so always create new instance
         var editDetails = new Alfresco.module.SimpleDialog(this.id + "-editDetails");
         editDetails.setOptions(
         {
            width: "1000px",
            templateUrl: templateUrl,
            actionUrl: null,
            destroyOnHide: true,
            doBeforeDialogShow:
            {
               fn: doBeforeDialogShow,
               scope: this
            },
            onSuccess:
            {
               fn: function DataGrid_onActionEdit_success(response)
               {
                  // Reload the node's metadata
                  Alfresco.util.Ajax.jsonPost(
                  {
                     url: Alfresco.constants.PROXY_URI + "slingshot/datalists/item/node/" + new Alfresco.util.NodeRef(item.nodeRef).uri,
                     //dataObj: this._buildDataGridParams(), //get old filter?
                     successCallback:
                     {
                        fn: function DataGrid_onActionEdit_refreshSuccess(response)
                        {
                           // Fire "itemUpdated" event
                           Bubbling.fire("dataItemUpdated",
                           {
                              item: response.json.item
                           });
                           // Display success message
                           Alfresco.util.PopupManager.displayMessage(
                           {
                              text: this.msg("message.details.success")
                           });
                        },
                        scope: this
                     },
                     failureCallback:
                     {
                        fn: function DataGrid_onActionEdit_refreshFailure(response)
                        {
                           Alfresco.util.PopupManager.displayMessage(
                           {
                              text: this.msg("message.details.failure")
                           });
                        },
                        scope: this
                     }
                  });
               },
               scope: this
            },
            onFailure:
            {
               fn: function DataGrid_onActionEdit_failure(response)
               {
                  Alfresco.util.PopupManager.displayMessage(
                  {
                     text: this.msg("message.details.failure")
                  });
               },
               scope: this
            }
         }).show();
      },
      /**
       * Edit Data Item pop-up
       *
       * @method onActionEdit
       * @param item {object} Object literal representing one data item
       */
      onActionView: function DataGrid_onActionEdit(item)
      {
        
         var templateUrl = YAHOO.lang.substitute(Alfresco.constants.URL_SERVICECONTEXT + "components/form?itemKind={itemKind}&itemId={itemId}&mode={mode}",
         {
            itemKind: "node",
            itemId: item.nodeRef,
            mode: "view"
         });

         // Using Forms Service, so always create new instance
         var viewDetails = new Alfresco.module.SimpleViewDialog(this.id + "-viewDetails");
         viewDetails.setOptions(
         {
            width: "1000px",
            templateUrl: templateUrl
         }).show();
      },
      
      /**
       * DataTable set-up and event registration
       *
       * @method _setupDataTable
       * @protected
       */
      _setupDataTable: function DataGrid__setupDataTable(columns)
      {
         // YUI DataTable column definitions
         var columnDefinitions =
         [
            { key: "nodeRef", label: "", sortable: false, formatter: this.fnRenderCellSelected(), width: 16 }
         ];
         
         var addedActions = false;
         var column;
         for (var i = 0, ii = this.datalistColumns.length; i < ii; i++)
         {
            column = this.datalistColumns[i];
            
            if ("actions" == column.name) {
            	// Add actions as last column
                columnDefinitions.push(
                   { key: "actions", label: this.msg("label.column.actions"), sortable: false, formatter: this.fnRenderCellActions(), width: 80 }
                );
                addedActions = true;
                continue;
            }
            columnDefinitions.push(
            {
               key: this.dataResponseFields[i],
               label: column.label,
               sortable: true,
               sortOptions:
               {
                  field: column.formsName,
                  sortFunction: this.getSortFunction()
               },
               formatter: this.getCellFormatter(column.dataType)
            });
         }

         if (!addedActions) {
	         // Add actions as last column
	         columnDefinitions.push(
	            { key: "actions", label: this.msg("label.column.actions"), sortable: false, formatter: this.fnRenderCellActions(), width: 80 }
	         );
         }
         // DataTable definition
         var me = this;
         this.widgets.dataTable = new YAHOO.widget.DataTable(this.id + "-grid", columnDefinitions, this.widgets.dataSource,
         {
            renderLoopSize: this.options.usePagination ? 16 : 32,
            initialLoad: false,
            dynamicData: true,
            "MSG_EMPTY": this.msg("message.empty"),
            "MSG_ERROR": this.msg("message.error"),
            paginator: this.widgets.paginator
         });
         
         this.widgets.paginator.unsubscribe('changeRequest',this.widgets.dataTable.onPaginatorChangeRequest);
         this.widgets.paginator.subscribe('changeRequest', this.onDataGridPaging,this,true);
         
         this.widgets.dataTable.unsubscribe("theadCellClickEvent", this.widgets.dataTable.onEventSortColumn);
         this.widgets.dataTable.subscribe("theadCellClickEvent",this.onDataGridSort,this,true);
         
         // Update totalRecords with value from server
         this.widgets.dataTable.handleDataReturnPayload = function DataGrid_handleDataReturnPayload(oRequest, oResponse, oPayload)
         {
            me.totalRecords = oResponse.meta.totalRecords;
            me.totalRecordsUpper = oResponse.meta.totalRecordsUpper;
            return oResponse.meta;
         };

         // Override abstract function within DataTable to set custom error message
         this.widgets.dataTable.doBeforeLoadData = function DataGrid_doBeforeLoadData(sRequest, oResponse, oPayload)
         {
            if (oResponse.error)
            {
               try
               {
                  var response = YAHOO.lang.JSON.parse(oResponse.responseText);
                  me.widgets.dataTable.set("MSG_ERROR", response.message);
               }
               catch(e)
               {
                  me._setDefaultDataTableErrors(me.widgets.dataTable);
               }
            }
            
            // We don't get an renderEvent for an empty recordSet, but we'd like one anyway
            if (oResponse.results.length === 0)
            {
               this.fireEvent("renderEvent",
               {
                  type: "renderEvent"
               });
            }
            
            // Must return true to have the "Loading..." message replaced by the error message
            return true;
         };

         // File checked handler
         this.widgets.dataTable.subscribe("checkboxClickEvent", function(e)
         { 
            var id = e.target.value; 
            this.selectedItems[id] = e.target.checked;
            Bubbling.fire("selectedItemsChanged");
         }, this, true);

         this.widgets.dataTable.on('rowDblclickEvent',function(aArgs) {
             var theTarget = aArgs.target;
             var theRecord = this.getRecord(theTarget);
             
             me.onActionView(theRecord.getData());
        });
         // Rendering complete event handler
         this.widgets.dataTable.subscribe("renderEvent", function()
         {
            Alfresco.logger.debug("DataTable renderEvent");
            
            // IE6 fix for long filename rendering issue
            if (YAHOO.env.ua.ie < 7)
            {
               var ie6fix = this.widgets.dataTable.getTableEl().parentNode;
               ie6fix.className = ie6fix.className;
            }

            // Deferred functions specified?
            for (var i = 0, j = this.afterDataGridUpdate.length; i < j; i++)
            {
               this.afterDataGridUpdate[i].call(this);
            }
            this.afterDataGridUpdate = [];
            
         // Update the paginator if it's been created
            if (this.widgets.paginator)
            {
               Alfresco.logger.debug("Setting paginator state: page=" + this.currentPage + ", totalRecords=" + this.totalRecords);

               this.widgets.paginator.setState(
               {
                  page: this.currentPage,
                  totalRecords: this.totalRecords
               });

               if (this.totalRecordsUpper)
               {
                  this.widgets.paginator.set("pageReportTemplate", this.msg("pagination.template.page-report.more"));
               }
               else
               {
                  this.widgets.paginator.set("pageReportTemplate", this.msg("pagination.template.page-report"));
               }

               this.widgets.paginator.render();
            }
         }, this, true);

         // Enable row highlighting
         this.widgets.dataTable.subscribe("rowMouseoverEvent", this.onEventHighlightRow, this, true);
         this.widgets.dataTable.subscribe("rowMouseoutEvent", this.onEventUnhighlightRow, this, true);
      },
      
      /**
       * Retrieves the Data List from the Repository
       *
       * @method populateDataGrid
       */
      populateDataGrid: function DataGrid_populateDataGrid()
      {
    	 this.populateFilterForm();
    	 Alfresco.component.ExtDataGrid.superclass.populateDataGrid.call(this);
      },
      
      populateFilterForm: function ExtDataGrid_populateFilterForm()
      {
    	  var filterFormUrl = YAHOO.lang.substitute(Alfresco.constants.URL_SERVICECONTEXT + "components/form?itemKind={itemKind}&itemId={itemId}&mode={mode}&formId={formId}&submitType=json&showCancelButton=false&showSubmitButton=false",
    	   {
              itemKind: "type",
              itemId: this.datalistMeta.itemType,
              formId:"filter",
              mode: "create",
              submitType: "json"
           });
    	  var data =
          {
             htmlid: this.id + "-extDgFilterForm"
          };
    	  
    	  Alfresco.util.Ajax.request(
		   {
	          url: filterFormUrl,
	          dataObj:data,
	          successCallback:
	          {
	             fn: this.onFilterFormTemplateLoaded,
	             scope: this
	          },
	          failureMessage: "Could not load dialog template from '" + this.options.templateUrl + "'.",
	          scope: this,
	          execScripts: true
	      });
      },
      
      /**
       * Event callback when filtr template has been loaded
       *
       * @method onFilterFormTemplateLoaded
       * @param response {object} Server response from load template XHR request
       */
      onFilterFormTemplateLoaded: function ExtDataGrid_onFilterFormTemplateLoaded(response)
      {
    	  this.filterFormResponse = response;
    	  this._createFilterForm();
           
      },
      
      _createFilterForm: function ExtDataGrid_createFilterForm() {
          if(Dom.get(this.id + "-filterform") !== null){
              Dom.get(this.id + "-filterform").innerHTML = this.filterFormResponse.serverResponse.responseText;
              //show filter form
              Dom.setStyle(this.id + "-filter", "visibility", "inherit");
         }  
      },
      
      onFilterFormSubmit: function ExtDataGrid_onFilterFormSubmit(){
    	  //alert(this.formsRuntime.getFormData());
    	  YAHOO.Bubbling.fire("changeFilter",
          {
             filterOwner: this.id,
             filterId: "filterform",
             filterData: Alfresco.util.toQueryString(this.formsRuntime.getFormData())
          });
      },
//      onFilterFormSave: function ExtDataGrid_onFilterFormSave(){
//          Alfresco.util.PopupManager.getUserInput({
//              okButtonText : "Speichern"
//          });
//          
//      },
      
      onFilterFormClear: function ExtDataGrid_onFilterFormClear(){
          //alert(this.formsRuntime.getFormData());
    	  this.currentFilter="";
    	  this.formsRuntime.reset();
    	  // Some specialized controls - e.g. auto-complete  or object-finder don't implement reset
    	  YAHOO.Bubbling.fire("resetForm");
          // Seems nobody is is listening
    	  // YAHOO.Bubbling.fire("resetFinder"); // Seems nobody is is listening
          // this.onFilterFormSubmit();
         // So this is the best way to get a "most of the time right" reset
         location.hash = '';
      },
      /**
       * DataList View change filter request event handler
       * @method onChangeFilter
       * @param layer {object} Event fired (unused)
       * @param args {array} Event parameters (new filterId)
       */
      onChangeFilter: function DataGrid_onChangeFilter(layer, args)
      {
         var obj = args[1];
         if (obj !== null)
         {
        	this._addSortingToNewFilter(obj, this.sortAsc, this.sortColumn);
       	 	Alfresco.component.ExtDataGrid.superclass.onChangeFilter.call(this, layer, args);
         }
      },
      /**
       * DataGrid View Filter changed event handler
       *
       * @method onFilterChanged
       * @param layer {object} Event fired (unused)
       * @param args {array} Event parameters (new filterId)
       */
      onFilterChanged: function DataGrid_onFilterChanged(layer, args)
      {
         var obj = args[1];
         if ((obj !== null) && (obj.filterId !== null))
         {
            obj.filterOwner = obj.filterOwner || Alfresco.util.FilterManager.getOwner(obj.filterId);

            // Should be a filterId in the arguments
            this.currentFilter = Alfresco.util.cleanBubblingObject(obj);
            Alfresco.logger.debug("DL_onFilterChanged: ", this.currentFilter);
            
            this._addSortingToNewFilter(this.currentFilter, this.sortAsc, this.sortColumn);
            
            if (this.currentFilter.filterId == "filterform" && this.formsRuntime){
            	// refill filter form
            	var filterData =  Alfresco.util.getQueryStringParameters(this.currentFilter.filterData);
            	
            	// get the form element
                var form = Dom.get(this.formsRuntime.formId);
                if (form !== null)
                {
                   var length = form.elements.length;
                   for (var i = 0; i < length; i++)
                   {
                      var element = form.elements[i];
                      var name = element.name;
                      if (name == "-" || element.disabled || element.type === "button")
                      {
                         continue;
                      }
                      if (name == undefined || name == "")
                      {
                         name = element.id;
                      }
                      var value = YAHOO.lang.trim(element.value);
                      if (name && filterData[name])
                      {
                    	//try to find form control component
                    	var control = Alfresco.util.ComponentManager.get(element.attributes.id.value+"-cntrl");
                    	if (control && control.name == "Alfresco.FilterDateRange"){
                    		var values = filterData[name].split("TO");
                    		if (values[0] != ""){
                    			control.currentFromDate = values[0];
                    			var dateEntry = Alfresco.util.fromISO8601(control.currentFromDate).toString(control.msg("form.control.date-picker.entry.date.format"));
                            	Dom.get(control.id + "-date-from").value = dateEntry;
                    		}
                            if (values[1] != ""){
                            	 control.currentToDate = values[1];
                             	var dateEntry = Alfresco.util.fromISO8601(control.currentToDate).toString(control.msg("form.control.date-picker.entry.date.format"));
                             	Dom.get(control.id + "-date-to").value = dateEntry;
                            }
                    		
                    	}else if (element.type == "hidden" && filterData[name].split(",").length > 0)
                        {
                    		element.value=filterData[name];
                    		var selectElement = Dom.get(element.id+"-entry");
                    		values = filterData[name].split(",");
                           
                               for (var j = 0, jj = selectElement.options.length; j < jj; j++)
                               {
                                  if (Alfresco.util.arrayContains(values,selectElement.options[j].value))
                                  {
                                	  selectElement.options[j].selected= true; 
                                  }else{
                                	  selectElement.options[j].selected= false;
                                  }
                               }
                            
                        }
                    	else{
                    		element.value=filterData[name];
                    	}
                        
                      }
                   }
                }
            } else if (!this.currentFilter.datagridFirstTimeNav && this.currentFilter.filterId != "filterform"){
            	//clear from
            	this._createFilterForm(); //this.populateFilterForm();
            }
         }
      },
      
     /**
      * Event handler called when the "onBeforeFormRuntimeInit" event is received.
      *
      * @method onBeforeFormRuntimeInit
      * @param layer {String} Event type
      * @param args {Object} Event arguments
      * <pre>
      *    args.[1].component: Alfresco.FormUI component instance,
      *    args.[1].runtime: Alfresco.forms.Form instance
      * </pre>
      */
     /*
      onBeforeFormRuntimeInit: function ExtDataGrid_onBeforeFormRuntimeInit(layer, args)
     {
        this.formUI = args[1].component;
        this.formsRuntime = args[1].runtime;
     },
     */
     
     /**
      * Event handler called when the "onAfterFormRuntimeInit" event is received.
      *
      * @method onAfterFormRuntimeInit
      * @param layer {String} Event type
      * @param args {Object} Event arguments
      * <pre>
      *    args.[1].component: Alfresco.FormUI component instance,
      *    args.[1].runtime: Alfresco.forms.Form instance
      * </pre>
      */
     onAfterFormRuntimeInit: function ExtDataGrid_onAfterFormRuntimeInit(layer, args)
     {
        var rt = args[1].runtime;
        if (rt.formId === this.id + "-extDgFilterForm-form") {
           this.formsRuntime = rt;
           var me = this,
               form = Dom.get(this.formsRuntime.formId);

           YAHOO.util.Event.removeListener(form, "keypress");
           YAHOO.util.Event.removeListener(form, KeyListener.KEYDOWN);
           /**
            * Prevent the Enter key from causing a double form submission
            */
           var fnStopEvent = function(id, keyEvent)
           {
              var event = keyEvent[1],
                  target = event.target ? event.target : event.srcElement;

              var targetId = target.id;
              if (!(targetId.contains(me.id) && targetId.contains("-extDgFilterForm")))
              {
                 //this is not from filterForm
                 return false;
              }

              if (target.tagName == "TEXTAREA")
              {
                 // Allow linefeeds in textareas
                 return false;
              }
              else if (target.tagName == "BUTTON" || Dom.hasClass(target, "yuimenuitemlabel"))
              {
                 // Eventlisteners for buttons and menus must be notified that the enter key was entered
              }
              else
              {
                 var targetName = target.name;
                 if (targetName && (targetName != "-"))
                 {
                    me.onFilterFormSubmit(event);
                 }
                 Event.stopEvent(event);
                 return false;
              }
           };
           var enterListener = new KeyListener(form,
               {
                  keys: KeyListener.KEY.ENTER
               }, fnStopEvent, YAHOO.env.ua.ie > 0 ? KeyListener.KEYDOWN : "keypress");
           enterListener.enable();
           if (this.currentFilter.filterId == "filterform"){

              YAHOO.Bubbling.fire("filterChanged",
                  {
                     filterOwner: this.id,
                     filterId: this.currentFilter.filterId,
                     filterData: Alfresco.util.toQueryString(this.currentFilter.filterData)
                  });
           }
        }
     },
     /**
      * Build URI parameter string for doclist JSON data webscript
      *
      * @method _buildDataGridParams
      * @param p_obj.filter {string} [Optional] Current filter
      * @return {Object} Request parameters. Can be given directly to Alfresco.util.Ajax, but must be JSON.stringified elsewhere.
      */
     _buildDataGridParams: function DataGrid__buildDataGridParams(p_obj)
     {
        var request =
        {
           fields: this.dataRequestFields,
           page : this.currentPage,
           size : this.options.pageSize,
           // total : this.totalRecords,
           noCache : new Date().getTime() 
        };
        
        if (p_obj && p_obj.filter)
        {
        	if (!p_obj.filter.sortField){
        		request.filter = 
		        {
        			filterId: p_obj.filter.filterId,
		            filterData:  Alfresco.util.getQueryStringParameters(p_obj.filter.filterData),
		            page : this.currentPage,
		            size : this.options.pageSize
		        };
        	} else {
        		request.filter = 
		        {
        			filterId: p_obj.filter.filterId,
		            filterData:  Alfresco.util.getQueryStringParameters(p_obj.filter.filterData),
		            sortField: p_obj.filter.sortField,
		            sortAsc: p_obj.filter.sortAsc,
		            page : this.currentPage,
		            size : this.options.pageSize
		        };
        	}
        }
        
        this.widgets.dataSource.connMgr.setDefaultPostHeader(Alfresco.util.Ajax.JSON);
        return request;
        
     },
      
     /**
      * DataSource set-up and event registration
      *
      * @method _setupDataSource
      * @protected
      */
     _setupDataSource: function DataGrid__setupDataSource()
     {
        var listNodeRef = new Alfresco.util.NodeRef(this.datalistMeta.nodeRef);
        
        for (var i = 0, ii = this.datalistColumns.length; i < ii; i++)
        {
           var column = this.datalistColumns[i],
              columnName = column.name.replace(":", "_"),
              fieldLookup = (column.type == "property" ? "prop" : "assoc") + "_" + columnName;
           
           this.dataRequestFields.push(columnName);
           this.dataResponseFields.push(fieldLookup);
           this.datalistColumns[fieldLookup] = column;
     }
      
        // DataSource definition
        this.widgets.dataSource = new YAHOO.util.DataSource(Alfresco.constants.PROXY_URI + "contentreich/slingshot/datalists/data/node/" + listNodeRef.uri,
        {
           connMethodPost: true,
           responseType: YAHOO.util.DataSource.TYPE_JSON,
           maxCacheEntries : 0,
           responseSchema:
           {
              resultsList: "items",
              metaFields:
              {
                 paginationRecordOffset: "startIndex",
                 totalRecords: "totalRecords",
                 totalRecordsUpper: "totalRecordsUpper"
              }
           }
        });
        this.widgets.dataSource.connMgr.setDefaultPostHeader(Alfresco.util.Ajax.JSON);

        // Intercept data returned from data webscript to extract custom metadata
        this.widgets.dataSource.doBeforeCallback = function DataGrid_doBeforeCallback(oRequest, oFullResponse, oParsedResponse)
        {
        	this.connMgr.setDefaultPostHeader(Alfresco.util.Ajax.JSON);
            this.connMgr.setDefaultXhrHeader(Alfresco.util.Ajax.JSON);
            
           // Container userAccess event
           var permissions = oFullResponse.metadata.parent.permissions;
           if (permissions && permissions.userAccess)
           {
              Bubbling.fire("userAccess",
              {
                 userAccess: permissions.userAccess
              });
           }
           
           return oParsedResponse;
        };
     },
     /**
      * Updates all Data Grid data by calling repository webscript with current list details
      *
      * @method _updateDataGrid
      * @private
      * @param p_obj.filter {object} Optional filter to navigate with
      */
     _updateDataGrid: function DataGrid__updateDataGrid(p_obj)
     {
        p_obj = p_obj || {};
        Alfresco.logger.debug("DataGrid__updateDataGrid: ", p_obj.filter);
        var successFilter = YAHOO.lang.merge({}, p_obj.filter !== undefined ? p_obj.filter : this.currentFilter),
           loadingMessage = null,
           timerShowLoadingMessage = null,
           me = this,
           params =
           {
              filter: successFilter
           };
        this._addSortingToNewFilter(params.filter, this.sortAsc, this.sortColumn);
        
        // Clear the current document list if the data webscript is taking too long
        var fnShowLoadingMessage = function DataGrid_fnShowLoadingMessage()
        {
           Alfresco.logger.debug("DataGrid__uDG_fnShowLoadingMessage: slow data webscript detected.");
           // Check the timer still exists. This is to prevent IE firing the event after we cancelled it. Which is "useful".
           if (timerShowLoadingMessage)
           {
              loadingMessage = Alfresco.util.PopupManager.displayMessage(
              {
                 displayTime: 0,
                 text: '<span class="wait">' + $html(this.msg("message.loading")) + '</span>',
                 noEscape: true
              });
              
              if (YAHOO.env.ua.ie > 0)
              {
                 this.loadingMessageShowing = true;
              }
              else
              {
                 loadingMessage.showEvent.subscribe(function()
                 {
                    this.loadingMessageShowing = true;
                 }, this, true);
              }
           }
        };
        
        // Reset the custom error messages
        this._setDefaultDataTableErrors(this.widgets.dataTable);
        
        // More Actions menu no longer relevant
        this.showingMoreActions = false;
        
        // Slow data webscript message
        this.loadingMessageShowing = false;
        timerShowLoadingMessage = YAHOO.lang.later(this.options.loadingMessageDelay, this, fnShowLoadingMessage);
        
        var destroyLoaderMessage = function DataGrid__uDG_destroyLoaderMessage()
        {
           if (timerShowLoadingMessage)
           {
              // Stop the "slow loading" timed function
              timerShowLoadingMessage.cancel();
              timerShowLoadingMessage = null;
           }

           if (loadingMessage)
           {
              if (this.loadingMessageShowing)
              {
                 // Safe to destroy
                 loadingMessage.destroy();
                 loadingMessage = null;
              }
              else
              {
                 // Wait and try again later. Scope doesn't get set correctly with "this"
                 YAHOO.lang.later(100, me, destroyLoaderMessage);
              }
           }
        };
        
        var successHandler = function DataGrid__uDG_successHandler(sRequest, oResponse, oPayload)
        {
           destroyLoaderMessage();
           // Updating the DotaGrid may change the item selection
           var fnAfterUpdate = function DataGrid__uDG_sH_fnAfterUpdate()
           {
              Bubbling.fire("selectedFilesChanged");
           };
           this.afterDataGridUpdate.push(fnAfterUpdate);
           
           Alfresco.logger.debug("currentFilter was:", this.currentFilter, "now:", successFilter);
           this.currentFilter = successFilter;
           this.currentPage = p_obj.page || 1;
           Bubbling.fire("filterChanged", successFilter);
           this.widgets.dataTable.onDataReturnReplaceRows.call(this.widgets.dataTable, sRequest, oResponse, oPayload);
//           
           this.widgets.dataSource.connMgr.setDefaultPostHeader(Alfresco.util.Ajax.JSON);
           this.widgets.dataSource.connMgr.setDefaultXhrHeader(Alfresco.util.Ajax.JSON);
        };
        
        var failureHandler = function DataGrid__uDG_failureHandler(sRequest, oResponse)
        {
           destroyLoaderMessage();
           // Clear out deferred functions
           this.afterDataGridUpdate = [];

           if (oResponse.status == 401)
           {
              // Our session has likely timed-out, so refresh to offer the login page
              window.location.reload(true);
           }
           else
           {
              try
              {
                 var response = YAHOO.lang.JSON.parse(oResponse.responseText);
                 this.widgets.dataTable.set("MSG_ERROR", response.message);
                 this.widgets.dataTable.showTableMessage(response.message + ". " + Alfresco.util.message("message.info.refresh"), YAHOO.widget.DataTable.CLASS_ERROR);
                 if (oResponse.status == 404)
                 {
                    // Site or container not found - deactivate controls
                    Bubbling.fire("deactivateAllControls");
                 }
              }
              catch(e)
              {
                 this._setDefaultDataTableErrors(this.widgets.dataTable);
              }
           }
        };
        
        // Update the DataSource
        var requestParams = this._buildDataGridParams(params);
        Alfresco.logger.debug("DataSource requestParams: ", requestParams);

        // TODO: No-cache? - add to URL retrieved from DataSource
        // "&noCache=" + new Date().getTime();

        if (Alfresco.util.CSRFPolicy.isFilterEnabled())
        {
           this.widgets.dataSource.connMgr.initHeader(Alfresco.util.CSRFPolicy.getHeader(), Alfresco.util.CSRFPolicy.getToken(), false);
        }
        this.widgets.dataSource.connMgr.setDefaultPostHeader(Alfresco.util.Ajax.JSON);
        this.widgets.dataSource.connMgr.setDefaultXhrHeader(Alfresco.util.Ajax.JSON);

        this.widgets.dataSource.sendRequest(YAHOO.lang.JSON.stringify(requestParams),
        {
           success: successHandler,
           failure: failureHandler,
           scope: this
        });
     },
     
     onDataGridPaging: function DataGrid_onDataGridRefresh(paginator, args)
     {
    	this.currentPage = paginator.page;    	
        this._updateDataGrid.call(this,
        {
           page: this.currentPage
        });
     },
     
     onDataGridSort: function DataGrid_onDataGridSort(e, dataGrid)
     {
    	YAHOO.util.Event.stopEvent(e.event);
    	var column = dataGrid.widgets.dataTable.getColumn(e.target.cellIndex);
    	if (!column.sortable) {
    		this._removeSortingClasses();
    		return; // not sortable
    	}
    	
    	var sortField = column.key;
    	if (dataGrid.sortColumn && dataGrid.sortColumn === sortField) {
    		dataGrid.sortAsc = (dataGrid.sortAsc) ? false : true;
    	} else {
    		dataGrid.sortColumn = sortField;
    		dataGrid.sortAsc = true;
    	}
   		dataGrid.currentFilter.sortField = sortField;
   		dataGrid.currentFilter.sortAsc = dataGrid.sortAsc;
   		
   		dataGrid._updateDataGrid.call(dataGrid,
	    {
   			page: dataGrid.currentPage
	    });
   		
   		this._addSortingClasses(e.target);
   		
     },
     
     _removeSortingClasses : function ExtDataGrid_removeSortingClasses() {
		var addClass = YAHOO.widget.DataTable.CLASS_DESC;
		var removeClass = YAHOO.widget.DataTable.CLASS_ASC;
		
		var headers = this.widgets.dataTable.getColumnSet().flat;
		for (var i = 0; headers.length > i; i++) {
			var header = headers[i].getThEl();
			if (Dom.hasClass(header, addClass))
				Dom.removeClass(header, addClass);
			if (Dom.hasClass(header, removeClass))
				Dom.removeClass(header, removeClass);
		}
	}, 
     _addSortingClasses : function ExtDataGrid_addSortingClasses(elm) {
    	this._removeSortingClasses();
		if (this.sortAsc) {
			var addClass = YAHOO.widget.DataTable.CLASS_ASC;
			var removeClass = YAHOO.widget.DataTable.CLASS_DESC;
		} else {
			var addClass = YAHOO.widget.DataTable.CLASS_DESC;
			var removeClass = YAHOO.widget.DataTable.CLASS_ASC;
		}
		Dom.addClass(elm, addClass);
		if (Dom.hasClass(elm, removeClass))
			Dom.removeClass(elm, removeClass);
	}, 
	     
     
     _addSortingToNewFilter : function ExtDataGrid_addSortingToNewFilter(newFilter, sortAsc, sortField)
     {
    	 if (null == newFilter.sortField) {
    		 newFilter.sortField = sortField;
    	 }
    	 if (null == newFilter.sortAsc) {
    		 newFilter.sortAsc = sortAsc;
    	 }
    	 
     }, 
      
     /**
      * Renders Data List metadata, i.e. title and description
      *
      * @method renderDataListMeta
      */
     renderDataListMeta: function DataGrid_renderDataListMeta()
     {
    	 Alfresco.component.ExtDataGrid.superclass.renderDataListMeta.call(this);

    	 var url = YAHOO.lang.substitute(Alfresco.constants.PROXY_URI + "/api/metadata?nodeRef={nodeRef}", {
    		 nodeRef : this.datalistMeta.nodeRef
    	 });
    	 Alfresco.util.Ajax.request({
             method : Alfresco.util.Ajax.GET,
             url : url,
             responseContentType : Alfresco.util.Ajax.JSON,
             successCallback : {
                fn : function DataGrid_populateLastUpdatedField(response)
                {
                   if (response && response.json)
                   {
                      var lastUpdate = response.json.properties["{http://www.alfresco.org/model/content/1.0}modified"];
                      var date = new Date(lastUpdate);
                      var info = this.msg("form.label.lastUpdate") + ": ";
                      info += YAHOO.lang.trim(date.toUTCString().replace("GMT", ""));
                      Alfresco.util.populateHTML([ this.id + "-last-updated", $html(info) ]);
                   }
                },
                scope : this,
             }
         });
     }   
   }, true);
})();
