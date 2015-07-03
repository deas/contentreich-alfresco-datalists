/**
 * SimpleViewDialog module.
 * 
 * @namespace Alfresco.module
 * @class Alfresco.module.SimpleViewDialog
 */
(function()
{
   var Dom = YAHOO.util.Dom,
      Selector = YAHOO.util.Selector,
      KeyListener = YAHOO.util.KeyListener;
   
   Alfresco.module.SimpleViewDialog = function(htmlId, components)
   {
      components = YAHOO.lang.isArray(components) ? components : [];
      
      return Alfresco.module.SimpleViewDialog.superclass.constructor.call(
         this,
         "Alfresco.module.SimpleViewDialog",
         htmlId,
         ["button", "container", "connection", "json", "selector"].concat(components));
   };

   YAHOO.extend(Alfresco.module.SimpleViewDialog, Alfresco.component.Base,
   {
      /**
       * Dialog instance.
       * 
       * @property dialog
       * @type YAHOO.widget.Panel
       */
      dialog: null,

       /**
        * Object container for initialization options
        */
       options:
       {
          /**
           * URL which will return template body HTML
           *
           * @property templateUrl
           * @type string
           * @default null
           */
          templateUrl: null,

          /**
           * Width for the dialog
           *
           * @property width
           * @type integer
           * @default 30em
           */
          width: "30em",
          
          
          /**
           * Destroy the dialog instead of hiding it?
           *
           * @property destroyOnHide
           * @type boolean
           * @default false
           */
          destroyOnHide: false
       },

      /**
       * Main entrypoint to show the dialog
       *
       * @method show
       */
      show: function AmSVD_show()
      {
         if (this.dialog)
         {
            this._showDialog();
         }
         else
         {
            var data =
            {
               htmlid: this.id
            };
            if (this.options.templateRequestParams)
            {
                data = YAHOO.lang.merge(this.options.templateRequestParams, data);
            }
            Alfresco.util.Ajax.request(
            {
               url: this.options.templateUrl,
               dataObj:data,
               successCallback:
               {
                  fn: this.onTemplateLoaded,
                  scope: this
               },
               failureMessage: "Could not load dialog template from '" + this.options.templateUrl + "'.",
               scope: this,
               execScripts: true
            });
         }
         return this;
      },
      
      /**
       * Show the dialog and set focus to the first text field
       *
       * @method _showDialog
       * @private
       */
      _showDialog: function AmSVD__showDialog()
      {
        

         this.dialog.show();
         
         // Register the ESC key to close the dialog
         this.widgets.escapeListener = new KeyListener(document,
         {
            keys: KeyListener.KEY.ESCAPE
         },
         {
            fn: function(id, keyEvent)
            {
               this._hideDialog();
            },
            scope: this,
            correctScope: true
         });
         this.widgets.escapeListener.enable();

      },

      /**
       * Hide the dialog
       *
       * @method hide
       */
      hide: function AmSD_hide()
      {
         this.widgets.escapeListener.disable();
         this._hideDialog();
      },


      /**
       * Hide the dialog, removing the caret-fix patch
       *
       * @method _hideDialog
       * @private
       */
      _hideDialog: function AmSD__hideDialog()
      {
         
         this.dialog.hide();
         if (this.options.destroyOnHide)
         {
            YAHOO.Bubbling.fire("formContainerDestroyed");
            this.dialog.destroy();
            delete this.dialog;
            delete this.widgets;
         }
      },
      
      /**
       * Event callback when dialog template has been loaded
       *
       * @method onTemplateLoaded
       * @param response {object} Server response from load template XHR request
       */
      onTemplateLoaded: function AmSVD_onTemplateLoaded(response)
      {
         // Inject the template from the XHR request into a new DIV element
         var containerDiv = document.createElement("div");
         containerDiv.innerHTML = response.serverResponse.responseText;

         // The panel is created from the HTML returned in the XHR request, not the container
         var dialogDiv = Dom.getFirstChild(containerDiv);
         while (dialogDiv && dialogDiv.tagName.toLowerCase() != "div")
         {
            dialogDiv = Dom.getNextSibling(dialogDiv);
         }
        
         // Create and render the YUI dialog
         Dom.addClass(dialogDiv, "bd");
         this.dialog = Alfresco.util.createYUIPanel(containerDiv,
         {
            width: this.options.width
         });
         this._showDialog();
      },

      /**
       * Cancel button event handler
       *
       * @method onCancel
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onCancel: function AmSVD_onCancel(e, p_obj)
      {
         this._hideDialog();
      }
   });

   /**
    * Dummy instance to load optional YUI components early.
    * Use fake "null" id, which is tested later in onComponentsLoaded()
   */
   var dummyInstance = new Alfresco.module.SimpleViewDialog("null");
})();
