(function()
{  
   
   YAHOO.lang.augmentObject(Alfresco.FormUI.prototype,
   {
	   onMandatoryControlValueUpdated: function FormUI_onMandatoryControlValueUpdated(layer, args)
	   {
	      // the value of a mandatory control on the page (usually represented by a hidden field)
	      // has been updated, force the forms runtime to check if form state is still valid
		  if (this.formsRuntime){
			  this.formsRuntime.updateSubmitElements();
		  }
	   }

   }, true);
   
   
  
})();
	 
