
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
       Event = YAHOO.util.Event,
       Selector = YAHOO.util.Selector,
       Bubbling = YAHOO.Bubbling;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
      $links = Alfresco.util.activateLinks,
      $combine = Alfresco.util.combinePaths,
      $userProfile = Alfresco.util.userProfileLink;


   Alfresco.component.ExtDataListToolbar = function(htmlId)
   {
      return Alfresco.component.ExtDataListToolbar.superclass.constructor.call(this, htmlId);
   };

   /**
    * Extend Alfresco.component.DataGrid 
    */
   YAHOO.extend(Alfresco.component.ExtDataListToolbar, Alfresco.component.DataListToolbar);

   /**
    * Augment prototype with Common Actions module
    */
   YAHOO.lang.augmentProto(Alfresco.component.ExtDataListToolbar, Alfresco.service.DataListActions);
   
   /**
    * Augment prototype with main class implementation, ensuring overwrite is enabled
    */
   YAHOO.lang.augmentObject(Alfresco.component.ExtDataListToolbar.prototype,
   {
	   	  /**
	       * Fired by YUI when parent element is available for scripting.
	       *
	       * @method onReady
	       */
	      onReady: function DataListToolbar_onReady()
	      {
	         this.widgets.exportCsvButton = Alfresco.util.createYUIButton(this, "exportCsvButton", this.onExportCsv,
	         {
	            disabled: true
	         });
	         Alfresco.component.ExtDataListToolbar.superclass.onReady.call(this);
	      },
	      
	      /**
	       * Export CSV button click handler
	       *
	       * @method onNewRow
	       * @param e {object} DomEvent
	       * @param p_obj {object} Object passed back from addListener method
	       */
	      onExportCsv: function ExtDataListToolbar_onExportCsv(e, p_obj)
	      {
	    	   var nodeRef = Alfresco.util.NodeRef(this.modules.dataGrid.datalistMeta.nodeRef)
	    	   window.location.href = Alfresco.constants.PROXY_URI + "/fme/slingshot/datalists/list/node/"+nodeRef.uri +"?format=xlsx";
	    	   
	      },

	      /**
	       * New Row button click handler
	       *
	       * @method onNewRow
	       * @param e {object} DomEvent
	       * @param p_obj {object} Object passed back from addListener method
	       */
	      onNewRow: function ExtDataListToolbar_onNewRow(e, p_obj)
	      {
	         var datalistMeta = this.modules.dataGrid.datalistMeta,
	            destination = datalistMeta.nodeRef,
	            itemType = datalistMeta.itemType;

	         // Intercept before dialog show
	         var doBeforeDialogShow = function DataListToolbar_onNewRow_doBeforeDialogShow(p_form, p_dialog)
	         {
	            Alfresco.util.populateHTML(
	               [ p_dialog.id + "-dialogTitle", this.msg("label.new-row.title") ],
	               [ p_dialog.id + "-dialogHeader", this.msg("label.new-row.header") ]
	            );
	         };
	         
	         var templateUrl = YAHOO.lang.substitute(Alfresco.constants.URL_SERVICECONTEXT + "components/form?itemKind={itemKind}&itemId={itemId}&destination={destination}&mode={mode}&submitType={submitType}&showCancelButton=true",
	         {
	            itemKind: "type",
	            itemId: itemType,
	            destination: destination,
	            mode: "create",
	            submitType: "json"
	         });

	         // Using Forms Service, so always create new instance
	         var createRow = new Alfresco.module.SimpleDialog(this.id + "-createRow");

	         createRow.setOptions(
	         {
	            width: "800px",
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
	               fn: function DataListToolbar_onNewRow_success(response)
	               {
	                  YAHOO.Bubbling.fire("dataItemCreated",
	                  {
	                     nodeRef: response.json.persistedObject
	                  });

	                  Alfresco.util.PopupManager.displayMessage(
	                  {
	                     text: this.msg("message.new-row.success")
	                  });
	               },
	               scope: this
	            },
	            onFailure:
	            {
	               fn: function DataListToolbar_onNewRow_failure(response)
	               {
	                  Alfresco.util.PopupManager.displayMessage(
	                  {
	                     text: this.msg("message.new-row.failure")
	                  });
	               },
	               scope: this
	            }
	         }).show();
	      }
      
   }, true);
})();
