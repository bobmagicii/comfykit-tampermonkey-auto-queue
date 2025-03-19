# ComfyKit - Auto Queue Tampermonkey Script

This is a script for Tampermonkey, maybe Greasemonkey too I don't know I
don't use that one, that latches onto the ComfyUI interface to provide an
auto queue function.

When enabled it will periodically check if the queue is empty. If it has been
empty for the time specified (30s by default) it will then click the Queue
button for you.

This was built to provide a way another tab I forgot about to still get stuff
done when the tab I am currently working in has finished.

It also allows some time for my laptop to cool off before running another job
so I can "run it all day" without running my GPU at 100% for 24 hours straight.
