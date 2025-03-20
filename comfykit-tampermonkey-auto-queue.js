// ==UserScript==
// @name         ComfyKit - Auto Queue Tool
// @namespace    bobmagicii
// @author       bobmagicii
// @version      1.0.0
// @description  If the queue has been idle for a while kick off a render. Work in other tabs without wasting too much idle GPU time or being unable to queue something sooner than later. This allows for your system to cool down a bit between renders or other processes to get stuff done.
// @include      /https?:\/\/(.+?):8188\/(.*?)/
// @grant        none
// ==/UserScript==

/*//////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

if you are not getting the Auto Queue button there are two main things that
could be going on:

	* the @include above needs to be fixed for your port number.
	* the selector properties below need to be fixed for updated comfyui.

last comfy version i personally updated it for:
	* Git: 65a865918277b9413571c00fa402c5ff0a224225
	* Date 2024-10-29

////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////*/

(function() {
	'use strict';

	////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////

	class QueueMgr {

		////////////////////////////////
		// CONFIG //////////////////////

		// this may need tweaked constantly with how fast comfy is iterating.

		selectorMenubar  = '.comfyui-body-top .comfyui-menu-right > .flex';
		selectorQueueBtn = 'button[aria-label="Queue"]';
		selectorQueueNum = 'button[aria-label="Queue (q)"] .p-badge';

		// tampermonkey is way faster than the comfyui front end so we need to sit
		// and spin a bit.

		bootAttemptMax   = 10;
		bootAttemptDelay = 2.0;

		// and these are the default queue values. check time is how frequently
		// it checks. while idle time is how long it must have witnessed the queue
		// idle before going to give your system some cooldown time or let some
		// other processes have their way with your hardware.

		queueCheckTime   = 2.0;
		queueIdleTime    = 30.0;

		// and some styles.

		bgToggleBtn = [ '#111111', '#11aa11' ];

		////////////////////////////////
		// NOT CONFIG //////////////////

		bootAttempt = null;
		elMenuBar   = null;
		elQueueBtn  = null;
		elQueueNum  = null;
		elToggleBtn = null;
		elInputFreq = null;
		elInputIdle = null;
		timerBoot   = null;
		timerQueue  = null;
		numInQueue  = null;
		idleTime    = null;
		enabled     = false;

		////////////////////////////////
		////////////////////////////////

		constructor() {

			this.bootAttempt = 0;
			this.tryToBootup();

			return;
		};

		tryToBootup() {

			let found = false;

			////////

			this.bootAttempt += 1;

			if(this.bootAttempt > this.bootAttemptMax)
			throw new Exception(`[QueueMgr.tryToBootup] bailing after ${this.bootAttemptMax} failed attempts.`);

			console.log(`[QueueMgr.tryToBootup] attempt ${this.bootAttempt}.`);

			////////

			this.elMenuBar = document.querySelector(this.selectorMenubar);
			this.elQueueBtn = document.querySelector(this.selectorQueueBtn);

			console.log(`[QueueMgr.tryToBootup] menu bar = ${this.elMenuBar}`);
			console.log(`[QueueMgr.tryToBootup] queue btn = ${this.elQueueBtn}`);

			////////

			found = (true
				&& (this.elMenuBar !== null)
				&& (this.elQueueBtn !== null)
			);

			if(!found) {
				setTimeout(
					(this.tryToBootup.bind(this)),
					(this.bootAttemptDelay * 1000)
				);

				return;
			}

			this.readConfigValues();
			this.addElementsToUI();

			return;
		};

		addElementsToUI() {

			let btnGrp = null;

			////////

			this.elToggleBtn = document.createElement('button');
			this.elToggleBtn.title = 'Toggle Auto Queue';
			this.elToggleBtn.classList.add('comfyui-button');
			this.elToggleBtn.addEventListener('click', this.onClickToggleBtn.bind(this));

			this.elInputIdle = document.createElement('input');
			this.elInputIdle.title = 'Seconds Idle Before Queue';
			this.elInputIdle.type = 'number';
			this.elInputIdle.value = this.queueIdleTime;
			this.elInputIdle.size = 4;
			this.elInputIdle.style.textAlign = 'center';
			this.elInputIdle.classList.add('comfyui-button');

			// this sets the state of the button too.
			this.turnAutoQueueOff();

			btnGrp = document.createElement('div');
			btnGrp.classList.add('comfyui-button-group');
			btnGrp.append(this.elToggleBtn);
			btnGrp.append(this.elInputIdle);

			this.elMenuBar.prepend(btnGrp);

			return;
		};

		////////////////////////////////
		////////////////////////////////

		tryToQueue() {

			let qnum = this.findQueueNumElement();

			////////

			if(qnum === null)
			this.updateQueueInfo(0);

			else
			this.updateQueueInfo(parseInt(qnum.innerText));

			console.log(`[QueueMgr.tryToQueue] queue size = ${this.numInQueue}.`);

			////////

			if(this.isIdleLong()) {
				console.log(`[QueueMgr.tryToQueue] adding to queue.`);
				this.elQueueBtn.click();
			}

			////////

			if(this.isAutoQueueOn())
			this.timerQueue = setTimeout(
				(this.tryToQueue.bind(this)),
				(this.queueCheckTime * 1000)
			);

			return;
		};

		turnAutoQueueOn() {

			this.enabled = true;
			this.elToggleBtn.innerText = 'AQ: ON';
			this.elToggleBtn.style.backgroundColor = this.bgToggleBtn[1];

			this.queueIdleTime = parseInt(this.elInputIdle.value) || 0;

			this.pushIdleTimeSetting();
			this.tryToQueue();

			return;
		};

		turnAutoQueueOff() {

			this.enabled = false;
			this.elToggleBtn.innerText = 'AQ: Off';
			this.elToggleBtn.style.backgroundColor = this.bgToggleBtn[0];

			if(this.timerQueue !== null) {
				clearInterval(this.timerQueue);
				this.timerQueue = null;
			}

			return;
		};

		isAutoQueueOn() {

			return this.enabled;
		};

		isIdle() {

			return (this.numInQueue === 0);
		};

		isIdleLong() {

			if(!this.isIdle())
			return false;

			if(this.getTimeSinceIdle() < this.queueIdleTime)
			return false;

			return true;
		};

		getTimeSinceIdle() {

			let val = (this.getTimestampNow() - this.idleTime);

			console.log(`[QueueMgr.getTimeSinceIdle] queue has been idle for ${val} sec.`);

			return val;
		};

		getTimestampNow() {

			return Math.floor(Date.now() / 1000);
		};

		findQueueNumElement() {

			// this element wont exist if the queue size is 0 so it will be
			// returning null in that case.

			return document.querySelector(this.selectorQueueNum);
		}

		updateQueueInfo(numInQueue) {

			// if the queue is empty but was not empty last time then
			// we need to update the timestamp of when it was last idled.

			if((numInQueue === 0) && (this.numInQueue !== 0))
			this.idleTime = this.getTimestampNow();

			////////

			this.numInQueue = numInQueue;

			return;
		};

		readConfigValues() {

			let val = null;

			////////

			val = this.fetchIdleTimeSetting();

			if(val !== null)
			this.queueIdleTime = val;

			////////

			return;
		};

		writeConfigValues() {

			this.pushIdleTimeSetting();

			return;
		};

		fetchIdleTimeSetting() {

			let val = localStorage.getItem(QueueMgr.ConfKeyIdleTime);

			////////

			if(typeof val === 'undefined')
			return null;

			if(val === null)
			return null;

			val = parseInt(val);

			if(Number.isNaN(val))
			return null;

			////////

			return val;
		};

		pushIdleTimeSetting() {

			localStorage.setItem(QueueMgr.ConfKeyIdleTime, this.queueIdleTime);

			return;
		};

		////////////////////////////////
		////////////////////////////////

		onClickToggleBtn() {

			////////

			if(this.isAutoQueueOn())
			this.turnAutoQueueOff();

			else
			this.turnAutoQueueOn();

			////////

			console.log(`[QueueMgr.onClickToggleBtn] enabled = ${(this.enabled ? 'true' : 'false')}`);

			return false;
		};

		////////////////////////////////
		////////////////////////////////

		static get ConfKeyIdleTime() {
			return 'bobmagicii.comfykit-autoqueue.queueIdleTime';
		};

		static OnReady() {
			console.log('[QueueMgr.OnReady] OK');

			new QueueMgr;

			return;
		};

		static WhenDocumentReady() {

			if(document.readyState != 'loading') {
				QueueMgr.OnReady();
				return;
			}

			document.addEventListener(
				'DOMContentLoaded',
				QueueMgr.OnReady
			);

			return;
		};

	};

	////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////

	QueueMgr.WhenDocumentReady();
	return;
})();
