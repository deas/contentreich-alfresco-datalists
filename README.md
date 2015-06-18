Datalist Extensions for Alfresco Share (for Alfresco)
===========================================================

This project is the Alfresco 4.2.x port of fme's datalist extensions.  I switched to github and maven because I personally don't like svn and ant. For now, the documentation remains at [google](http://code.google.com/p/fme-alfresco-extensions/wiki/DatalistExtension).

Altough the project has not seen a lot of testing on 5.0.x - this version of Alfresco is now the primary target. The master branch may still work with 4.2.x.


*Warning*: Starting with version 1.4.0, I started weeding out all the overwriting which causes tons of issues. Hence, you might be missing features provided by the old hacked model. I may reintroduce these model tweaks as a propert extension (not overrideing model).

Installation
============

* Run `mvn package`
* Put `./fme-alfresco-extdl-share/target/fme-alfresco-extdl-share-x.y.jar` in `tomcat/shared/lib` or `tomcat/webapps/share/WEB-INF/lib`
* Put `./fme-alfresco-extdl-repo/target/fme-alfresco-extdl-repo-x.y.jar` in `tomcat/webapps/alfresco/WEB-INF/lib`

Customization Example
=====================
See repo custom context for an approach: https://github.com/tass01024/fme-alfresco-extdl/blob/master/fme-alfresco-extdl-repo/example/my-custom-datalists-context.xml

Thanks Jan for supporting me !
