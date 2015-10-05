<div class="form-field">

   <#if form.mode == "view" || field.disabled>
      <div class="viewmode-field">
         <span class="viewmode-label">${field.label?html}:</span>
         <span class="viewmode-value" id="${fieldHtmlId}-value"></span>
      </div>
      <#if field.value??>
      <script type="text/javascript">//<![CDATA[
      (function()
      {
          var updateElementWithUserMetadata = function(userNames, element)
          {
              if (userNames.length > 0)
              {
                  var userName = userNames.pop();
                  Alfresco.util.Ajax.jsonRequest(
                  {
                      method : "GET",
                      url : Alfresco.constants.PROXY_URI + "api/people/" + userName,
                      successCallback :
                      {
                          fn : function(response)
                          {
                              var name = "";
                              if (response.json.firstName)
                              {
                                  name += response.json.firstName;
                              }
                              if (response.json.firstName && response.json.lastName)
                              {
                                  name += " ";
                              }
                              if (response.json.lastName)
                              {
                                  name += response.json.lastName;
                              }
                              if (!name)
                              {
                                  name = userName;
                              }
                              if (element.innerHTML)
                              {
                                 element.innerHTML += ", ";
                              }
                              element.innerHTML += Alfresco.util.userProfileLink(userName, name, "", false);
                              
                              if (userNames.length > 0)
                              {
                                  updateElementWithUserMetadata(userNames, element);
                              }
                          },
                          scope: this
                      },
                      failureCallback :
                      {
                          fn : function(response)
                          {
                              if (element.innerHTML)
                              {
                                 element.innerHTML += ", ";
                              }
                              element.innerHTML += userName;
                              if (userNames.length > 0)
                              {
                                  updateElementWithUserMetadata(userNames, element);
                              }
                          },
                          scope: this
                      }
                  });
              }
          };
          YAHOO.util.Event.onContentReady("${fieldHtmlId}-value", function ()
			{
			   var element = YAHOO.util.Dom.get("${fieldHtmlId}-value");
	           element.innerHTML = "";
	           var fieldValue = "${field.value?html}";
	           if (fieldValue)
	           {
	               var userNames = fieldValue.split(",");
	               updateElementWithUserMetadata(userNames, element);
	           }
			}, this);
          /**/
      })();
      //]]>
      </script>
      </#if>
   </#if>
</div>