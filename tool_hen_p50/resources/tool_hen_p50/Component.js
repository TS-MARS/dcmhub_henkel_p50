sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "tool_hen_p50/model/models"
], function (UIComponent, Device, models) {
    "use strict";

    return UIComponent.extend("tool_hen_p50.Component", {

        metadata: {
            manifest: "json"
        },

        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * @public
         * @override
         */
        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // enable routing
            this.getRouter().initialize();

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            this.setInactivityTimeout(15 * 60 * 1000);
            this.startInactivityTimer();

            var self = this;

            /**
             * Each time a request is issued, reset the inactivity countdown
             */
            window.addEventListener("click", function () {
                self.resetInactivityTimeout();
            });
        },
        /**
            * Set to correspond to something less than the SESSION_TIMEOUT value that you set for your approuter
            * @see https://help.sap.com/viewer/4505d0bdaf4948449b7f7379d24d0f0d/2.0.04/en-US/5f77e58ec01b46f6b64ee1e2afe3ead7.html
            */
        countdown: 2124000,  /* 29 minutes; SESSION_TIMEOUT defaults to 30 minutes */
        resetCountdown: 2124000,

        /**
         * Return number of milliseconds left till automatic logout
         */
        getInactivityTimeout: function () {
            return this.countdown;
        },

        /**
         * Set number of minutes left till automatic logout
         */
        setInactivityTimeout: function (timeout_millisec) {
            this.countdown = timeout_millisec;
            this.resetCountdown = this.countdown;
        },

        /**
         * Set number of minutes left till automatic logout
         */
        resetInactivityTimeout: function () {
            this.countdown = this.resetCountdown;
        },

        /**
         * Begin counting tracking inactivity
         */
        startInactivityTimer: function () {
            var self = this;
            this.intervalHandle = setInterval(function () {
                self._inactivityCountdown();
            }, 100000);
        },

        stopInactivityTimer: function () {
            if (this.intervalHandle !== null) {
                clearInterval(this.intervalHandle);
                this.intervalHandle = null;
            }
        },

        _inactivityCountdown: function () {
            this.countdown -= 100000;
            if (this.countdown <= 0) {
                this.stopInactivityTimer();
                this.resetInactivityTimeout();
                window.location.href = '/logout';
            }
        }
    });
});