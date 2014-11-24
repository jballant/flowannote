flowannote
==========

Adds or removes '@flow' annotation to the top of a file or a list of files.

Example usage:
--------

```
flowannote --add ../path/to/js-directory
```

The above command would recusively search "js-directory" directory the add the comment "/* @flow */" to the top of all files found.


Options
-------

* ```--add```: String path to directory or file. Adds the flow annotation to all files in the directory specified. If the path is a file, only adds the annotation to that file.
* ```--remove```: String path to directory or file. Removes the flow annotation from all the files in the directory specified. If the path is a file, only removes the annotation from that file.
* ```--weak```: Boolean flag. If adding annotations and this flag is provided, the add command uses the '@flow weak' annotation instead.
* ```--listOfFiles```: String path to json file. Paired with an "--add" or "--remove" flag. Adds or removes the flow annotation to all files specified in the json file. The json file must be a simple array of paths.
