# ComfyKit - Auto Queue Tampermonkey Script

This is a script for Tampermonkey, maybe Greasemonkey too I don't know I
don't use that one, that latches onto the ComfyUI interface to provide an
auto queue function.

When enabled it will periodically check if the queue is empty. If it has been
empty for the time specified (30s by default) it will then click the Queue
button for you.

This was built to provide a way another tab I forgot about to still get stuff
done when the tab I am currently working in has finished and I walk off to
Photoshop forgetting about the other tab.

This also allows some time for my laptop to cool off before running another job
so I can "run it all day" without running my GPU at 100% for 24 hours straight,
which is why I don't like to queue large batches.


# Notes

ComfyUI has been updating the UI frequently and I do not update mine very
frequently at all due to how I enjoy tools working when I need them.

Additionally sampler stuff seems to change a bit here and there in updates
which can cause rendering differences if I am in the middle of a project so I
tend to only update Comfy when bored. Hopefully they do not change the UI too
much more but in the event it is not working the properties at the top of
the QueueMgr class can be updated to try and catch however it has changed this
time.

If you have working selectors for other versions let me know and I will add
them here with a credit to make it easier for people to fix it for them.

	* Git: 65a865918277b9413571c00fa402c5ff0a224225
	* Date: 2024-10-29
	* Source: bobmagicii
		- selectorMenubar  = '.comfyui-body-top .comfyui-menu-right > .flex';
		- selectorQueueBtn = 'button[aria-label="Queue"]';
		- selectorQueueNum = 'button[aria-label="Queue (q)"] .p-badge';


# Issues

If you are not getting the Auto Queue button there are two main things that
could be going on:

	* The @include at the top of the script needs to be updated for the port
	  number you are running ComfyUI upon.

	* The selector properties at the top of the QueueMgr class need to be
	  tweaked for changes in the ComfyUI interface.

