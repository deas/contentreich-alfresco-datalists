Datalist Extensions for Alfresco Share (for Alfresco 4.x)
===========================================================

This project is the Alfresco 4.x port of fme's datalist extensions.  I switched to github and maven because I personally don't like svn and ant. For now, the documentation remains at [google](http://code.google.com/p/fme-alfresco-extensions/wiki/DatalistExtension).

Altough the project has not seen a lot of testing on 4.2.x - this version of Alfresco is now the primary target. The master branch may still work with 4.0.x.

Installation
============

* Run `mvn package`
* Put `./fme-alfresco-extdl-share/target/fme-alfresco-extdl-share-1.2.jar` in `tomcat/shared/lib` or `tomcat/webapps/share/WEB-INF/lib`
* Put `./fme-alfresco-extdl-repo/target/fme-alfresco-extdl-repo-1.2.jar` in `tomcat/webapps/alfresco/WEB-INF/lib`


Thanks Jan for supporting me !