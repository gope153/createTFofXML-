# Dataset creator for tensorflow

## Installation

just clone the git with

`git clone`

## what do you need?

you have two ways. either you create a voc set where you have the images in a folder and the xmls the folder above or you have a set of images where the object is always at the same x,y point and always the same size. then you create only one xml of one image and name it template.xml and copy it to the images 

## usage

`node index.js --set MyFirstSet`

where my first set can be anything. aftewards you have a readyset in the folder with tfrecords for train and test and the images as well as the label text map file. every 10th image is taken for eval (test)

