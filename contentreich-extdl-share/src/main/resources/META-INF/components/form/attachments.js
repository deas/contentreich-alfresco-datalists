
/**
 * AttachmentControl component.
 * 
 * @namespace Alfresco
 * @class Alfresco.AttachmentControl
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
   	$hasEventInterest = Alfresco.util.hasEventInterest;

   /**
    * AttachmentControl constructor.
    * 
    * @param {String} htmlId The HTML id of the control element
    * @return {Alfresco.AttachmentControl} The new AttachmentControl instance
    * @constructor
    */
   Alfresco.AttachmentControl = function(htmlId)
   {
      Alfresco.AttachmentControl.superclass.constructor.call(this, "Alfresco.AttachmentControl", htmlId, ["button", "container", "cookie"]);
      this.fileUpload = null;
      
      return this;
   };
   
   YAHOO.extend(Alfresco.AttachmentControl, Alfresco.component.Base,
   {
	   /**
       * Object container for initialization options
       *
       * @property options
       * @type object
       */
      options:
      {
         
         /**
          * current nodeRef
          * 
          * @property nodeRef
          * @type object
          */
         nodeRef: null,
         
         /**
          * object picker
          * @property picker
          * @type Alfresco.ObjectFinder
          */
          objectFinder: null
      },
 
      
      /**
       * Fired by YUI when parent element is available for scripting.
       * Component initialisation, including instantiation of YUI widgets and event listener binding.
       *
       * @method onReady
       */
      onReady: function AttachmentControl_onReady()
      {
    	   this.widgets.uploadAttachment = Alfresco.util.createYUIButton(this, "button", this.onUploadAttachment,
	         {
	            disabled: false
	         });   
      },

      /**
       * Upload Attachment button click handler
       *
       * @method onUploadAttachment
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
       onUploadAttachment: function AttachmentControl_onUploadAttachment(e, p_obj)
      {
    	   if (!this.widgets.destinationDialog)
           {
              this.widgets.destinationDialog = new Alfresco.module.DoclibGlobalFolder(this.id + "-destinationDialog");
              this.widgets.destinationDialog.setOptions(
              {
                 title: this.msg("form.attachments.dialog.destination.title"),
                 siteId : Alfresco.constants.SITE,
                 containerId: "documentLibrary",
                 allowedViewModes:
                     [
                        Alfresco.module.DoclibGlobalFolder.VIEW_MODE_SITE
                     ]
              });

              YAHOO.Bubbling.on("folderSelected", function (layer, args)
              {
                 if ($hasEventInterest(this.widgets.destinationDialog, args))
                 {
                    var selectedFolder = args[1].selectedFolder;
                    if (selectedFolder !== null)
                    {
                       if (this.fileUpload === null)
                       {
                          this.fileUpload = Alfresco.getFileUploadInstance(); 
                       }
                       
                       // Show uploader for multiple files
                       var multiUploadConfig =
                       {
                          siteId: selectedFolder.siteId,
                          containerId: selectedFolder.containerId,
                          uploadDirectory: selectedFolder.path,
                          filter: [],
                          mode: this.fileUpload.MODE_MULTI_UPLOAD,
                          thumbnails: "doclib",
                          onFileUploadComplete:
                          {
                             fn: this.onFileUploadComplete,
                             scope: this
                          }
                       };
                       this.fileUpload.show(multiUploadConfig);
                       
                    }
                 }
              }, this);
           }
           this.widgets.destinationDialog.setOptions(
           {
             //
           });
           this.widgets.destinationDialog.showDialog();
      },
      
      /**
       * File Upload complete event handler
       *
       * @method onFileUploadComplete
       * @param complete {object} Object literal containing details of successful and failed uploads
       */
      onFileUploadComplete: function DLTB_onFileUploadComplete(complete)
      {
         var success = complete.successful.length, file;
         if (success > 0)
         {
           for (var i = 0; i < success; i++)
           {
              file = complete.successful[i];
              file.name = file.fileName;
              YAHOO.Bubbling.fire("selectedItemAdded",
              {
                 eventGroup: this.options.objectFinder,
                 item : file
              });
           }
           YAHOO.Bubbling.fire("renderCurrentValue",
	         {
	            eventGroup: this.options.objectFinder
	         });
         }
      }
   });
})();