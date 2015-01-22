<import resource="classpath:alfresco/templates/webscripts/org/alfresco/slingshot/datalists/filters.lib.js">

var getFilterParams_orig = Filters.getFilterParams;


/**
    * Create filter parameters based on input parameters
    *
    * @method getFilterParams
    * @param filter {string} Required filter
    * @param parsedArgs {object} Parsed arguments object literal
    * @return {object} Object literal containing parameters to be used in Lucene search
    */
Filters.getFilterParams = function Filter_getFilterParams(filter, parsedArgs)
   {
	var filterParams = getFilterParams_orig(filter, parsedArgs);

      switch (String(filter.filterId))
      {
         case "filterform":
         	//we have a filter form!
        	  	var filterData = filter.filterData;
        	  	
             filterQuery = "+PARENT:\"" + parsedArgs.nodeRef;
             if (parsedArgs.nodeRef == "alfresco://sites/home")
             {
                // Special case for "Sites home" pseudo-nodeRef
                filterQuery += "/*/cm:dataLists";
             }
             filterQuery += "\"";
             filterQuery += " -TYPE:\"folder\"";
             
             var fieldNamesIterator = filterData.getFieldNames().iterator();
             for ( ; fieldNamesIterator.hasNext(); ){
             	var fieldName = fieldNamesIterator.next();
             	if (filterData.getFieldData(fieldName).getValue()!= ""){
 	            	var luceneFieldName = fieldName.replace("prop_","").replace("assoc_","").replace("_added","Added").replace("_","\\:");
 	            	var value = new String(filterData.getFieldData(fieldName).getValue());
 	            	if (luceneFieldName.indexOf("-date-range") > 0){
 	            		luceneFieldName = luceneFieldName.replace("-date-range","");
             			var dates = value.split("TO");
             			if (dates[0] == ""){
             				filterQuery += " +@"+ luceneFieldName +":[MIN TO " + dates[1] +']'; //use utils.fromISO8601(dates[1]) ?
             			}
             			else if (dates[1] == ""){
             				filterQuery += " +@"+ luceneFieldName +":[" + dates[0]+ " TO MAX]";
             			}else{
             				filterQuery += " +@"+ luceneFieldName +":[" +  dates[0] + " TO " + dates[1] +']';
             			}
 	            		
 	            	}
 	            	else if (0 < value.indexOf(",") || luceneFieldName.indexOf("Priority") > 0 || luceneFieldName.indexOf("Status") > 0 || luceneFieldName.indexOf("assignedToAdded") > 0 || luceneFieldName.indexOf("taskInitiator") > 0 || luceneFieldName.indexOf("lastModifier") > 0 ){
             			var values = value.split(",");
             			if (values.length > 1){
             				filterQuery += " +(";
             				for (var i = 0; i < values.length;i++){
             					if (i > 0){
             						filterQuery += " OR ";
             					}
             					filterQuery += " @"+ luceneFieldName +":\"" +  values[i] + '"';
                 			}
             				filterQuery += ") ";
             			}else{
             				filterQuery += " +@"+ luceneFieldName +":\"" +  value + '"';
             			}
 	            	}
 	            	else{
 	            		filterQuery += " +@"+ luceneFieldName +":\"*" +  value + '*"';
 	            	}
 	            	
             	}
             }
            
             
             filterParams.query = filterQuery + filterParams.query;	
        	  	
        	  	
         	 break;
      };

      return filterParams;
   };
   
//   Filter.getSortParams = function Filter_getSortParams(filterData, parsedArgs) {
//	   var size = filterData.get("size");
//	   var page = filterData.get("page");
//	   var sortAsc = filterData.get("sortAsc");
//	   var luceneFieldName = filterData.get("sortField").replace("assoc_","").replace("prop_","").replace("_","\\:");
//	   var filterParams =
//	      {
//	         query: "+PARENT:\"" + parsedArgs.nodeRef + "\" ",
//	         sort: [
//	         {
//	            column: luceneFieldName,
//	            ascending: eval(sortAsc)
//	         }],
//	         page:
//	         {
//	            maxItems: size,
//	            skipCount: (page-1) * size
//	         },
//	         language: "lucene",
//	         templates: null
//	      };
//	   
//		
//		return filterParams;
//	};

