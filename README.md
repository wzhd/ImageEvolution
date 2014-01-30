<a target="_blank" href="https://chrome.google.com/webstore/detail/image-evolution/ikleegnjmjhbjpoghhlmmbhpchbgollc">![Try it now in CWS](https://raw.github.com/wzhd/ImageEvolution/master/tryitnowbutton.png "Click here to install this sample from the Chrome Web store")</a>

# Cool App - Image Evolution
The goal is to get an image represented as a collection of overlapping polygons of various colors and transparencies.
We start from random 50 polygons that are invisible. In each optimization step we randomly modify one parameter (like color components or polygon vertices) and check whether such new variant looks more like the original image. If it is, we keep it, and continue to mutate this one instead.

Displayed fitness is a percentage of how close the new image is to the original one (1-current difference/maximum difference). The best possible is 100%. This new fitness is normalized so that it's easier to compare different images and different sizes.

The algorithm is from this page:
http://alteredqualia.com/visualization/evolve/

Which is in turn a reimplementation of Roger Alsing's idea, more information:
http://rogeralsing.com/2008/12/11/genetic-programming-mona-lisa-source-code-and-binaries/

And there is a C version for Linux that runs fast:
http://github.com/mackstann/mona/tree/master
