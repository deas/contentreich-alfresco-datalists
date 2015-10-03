
/**
 * VersionControl component.
 * 
 * @namespace Alfresco
 * @class Alfresco.VersionControl
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
   var $html = Alfresco.util.encodeHTML;

   /**
    * VersionControl constructor.
    * 
    * @param {String} htmlId The HTML id of the control element
    * @return {Alfresco.VersionControl} The new VersionControl instance
    * @constructor
    */
   Alfresco.VersionControl = function(htmlId)
   {
      Alfresco.VersionControl.superclass.constructor.call(this, "Alfresco.VersionControl", htmlId);
      
      return this;
   };
   
   YAHOO.extend(Alfresco.VersionControl, Alfresco.component.Base,
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
	          * @property editorParameters
	          * @type object
	          */
	         nodeRef: null
	      },
 
      
      /**
       * Fired by YUI when parent element is available for scripting.
       * Component initialisation, including instantiation of YUI widgets and event listener binding.
       *
       * @method onReady
       */
      onReady: function VersionControl_onReady()
      {
    	   Alfresco.util.Ajax.jsonGet(
	         {
	            url: Alfresco.constants.URL_SERVICECONTEXT + "components/datalist/datalist-versions",
	            dataObj:
	            {
	        	   htmlid: this.id,
	               nodeRef: this.options.nodeRef
	            },
	            successCallback:
	            {
	               fn: this.onTemplateLoaded,
	               scope: this
	            },
	            execScripts: true
	         });
      },
      
      /**
       * Event callback when this component has been reloaded via AJAX call
       *
       * @method onTemplateLoaded
       * @param response {object} Server response from load template XHR request
       */
      onTemplateLoaded: function AmSD_onTemplateLoaded(response)
      {
    	   
    	 // Inject the template from the XHR request into a new DIV element
         var containerDiv = Dom.get(this.id);
         containerDiv.innerHTML = response.serverResponse.responseText;
      }
   });
})();