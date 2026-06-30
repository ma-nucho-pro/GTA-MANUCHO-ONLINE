var et = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};

function rs(c) {
    return c && c.__esModule && Object.prototype.hasOwnProperty.call(c, "default") ? c.default : c
}
var Ct = {};
var vr;

function Ln() {
    return vr || (vr = 1, (function(c) {
        (function() {
            var e = function() {
                this.init()
            };
            e.prototype = {
                init: function() {
                    var i = this || t;
                    return i._counter = 1e3, i._html5AudioPool = [], i.html5PoolSize = 10, i._codecs = {}, i._howls = [], i._muted = !1, i._volume = 1, i._canPlayEvent = "canplaythrough", i._navigator = typeof window < "u" && window.navigator ? window.navigator : null, i.masterGain = null, i.noAudio = !1, i.usingWebAudio = !0, i.autoSuspend = !0, i.ctx = null, i.autoUnlock = !0, i._setup(), i
                },
                volume: function(i) {
                    var a = this || t;
                    if (i = parseFloat(i), a.ctx || h(), typeof i < "u" && i >= 0 && i <= 1) {
                        if (a._volume = i, a._muted) return a;
                        a.usingWebAudio && a.masterGain.gain.setValueAtTime(i, t.ctx.currentTime);
                        for (var f = 0; f < a._howls.length; f++)
                            if (!a._howls[f]._webAudio)
                                for (var p = a._howls[f]._getSoundIds(), d = 0; d < p.length; d++) {
                                    var m = a._howls[f]._soundById(p[d]);
                                    m && m._node && (m._node.volume = m._volume * i)
                                }
                        return a
                    }
                    return a._volume
                },
                mute: function(i) {
                    var a = this || t;
                    a.ctx || h(), a._muted = i, a.usingWebAudio && a.masterGain.gain.setValueAtTime(i ? 0 : a._volume, t.ctx.currentTime);
                    for (var f = 0; f < a._howls.length; f++)
                        if (!a._howls[f]._webAudio)
                            for (var p = a._howls[f]._getSoundIds(), d = 0; d < p.length; d++) {
                                var m = a._howls[f]._soundById(p[d]);
                                m && m._node && (m._node.muted = i ? !0 : m._muted)
                            }
                    return a
                },
                stop: function() {
                    for (var i = this || t, a = 0; a < i._howls.length; a++) i._howls[a].stop();
                    return i
                },
                unload: function() {
                    for (var i = this || t, a = i._howls.length - 1; a >= 0; a--) i._howls[a].unload();
                    return i.usingWebAudio && i.ctx && typeof i.ctx.close < "u" && (i.ctx.close(), i.ctx = null, h()), i
                },
                codecs: function(i) {
                    return (this || t)._codecs[i.replace(/^x-/, "")]
                },
                _setup: function() {
                    var i = this || t;
                    if (i.state = i.ctx && i.ctx.state || "suspended", i._autoSuspend(), !i.usingWebAudio)
                        if (typeof Audio < "u") try {
                            var a = new Audio;
                            typeof a.oncanplaythrough > "u" && (i._canPlayEvent = "canplay")
                        } catch {
                            i.noAudio = !0
                        } else i.noAudio = !0;
                    try {
                        var a = new Audio;
                        a.muted && (i.noAudio = !0)
                    } catch {}
                    return i.noAudio || i._setupCodecs(), i
                },
                _setupCodecs: function() {
                    var i = this || t,
                        a = null;
                    try {
                        a = typeof Audio < "u" ? new Audio : null
                    } catch {
                        return i
                    }
                    if (!a || typeof a.canPlayType != "function") return i;
                    var f = a.canPlayType("audio/mpeg;").replace(/^no$/, ""),
                        p = i._navigator ? i._navigator.userAgent : "",
                        d = p.match(/OPR\/(\d+)/g),
                        m = d && parseInt(d[0].split("/")[1], 10) < 33,
                        g = p.indexOf("Safari") !== -1 && p.indexOf("Chrome") === -1,
                        v = p.match(/Version\/(.*?) /),
                        y = g && v && parseInt(v[1], 10) < 15;
                    return i._codecs = {
                        mp3: !!(!m && (f || a.canPlayType("audio/mp3;").replace(/^no$/, ""))),
                        mpeg: !!f,
                        opus: !!a.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ""),
                        ogg: !!a.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""),
                        oga: !!a.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""),
                        wav: !!(a.canPlayType('audio/wav; codecs="1"') || a.canPlayType("audio/wav")).replace(/^no$/, ""),
                        aac: !!a.canPlayType("audio/aac;").replace(/^no$/, ""),
                        caf: !!a.canPlayType("audio/x-caf;").replace(/^no$/, ""),
                        m4a: !!(a.canPlayType("audio/x-m4a;") || a.canPlayType("audio/m4a;") || a.canPlayType("audio/aac;")).replace(/^no$/, ""),
                        m4b: !!(a.canPlayType("audio/x-m4b;") || a.canPlayType("audio/m4b;") || a.canPlayType("audio/aac;")).replace(/^no$/, ""),
                        mp4: !!(a.canPlayType("audio/x-mp4;") || a.canPlayType("audio/mp4;") || a.canPlayType("audio/aac;")).replace(/^no$/, ""),
                        weba: !!(!y && a.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, "")),
                        webm: !!(!y && a.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, "")),
                        dolby: !!a.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/, ""),
                        flac: !!(a.canPlayType("audio/x-flac;") || a.canPlayType("audio/flac;")).replace(/^no$/, "")
                    }, i
                },
                _unlockAudio: function() {
                    var i = this || t;
                    if (!(i._audioUnlocked || !i.ctx)) {
                        i._audioUnlocked = !1, i.autoUnlock = !1, !i._mobileUnloaded && i.ctx.sampleRate !== 44100 && (i._mobileUnloaded = !0, i.unload()), i._scratchBuffer = i.ctx.createBuffer(1, 1, 22050);
                        var a = function(f) {
                            for (; i._html5AudioPool.length < i.html5PoolSize;) try {
                                var p = new Audio;
                                p._unlocked = !0, i._releaseHtml5Audio(p)
                            } catch {
                                i.noAudio = !0;
                                break
                            }
                            for (var d = 0; d < i._howls.length; d++)
                                if (!i._howls[d]._webAudio)
                                    for (var m = i._howls[d]._getSoundIds(), g = 0; g < m.length; g++) {
                                        var v = i._howls[d]._soundById(m[g]);
                                        v && v._node && !v._node._unlocked && (v._node._unlocked = !0, v._node.load())
                                    }
                            i._autoResume();
                            var y = i.ctx.createBufferSource();
                            y.buffer = i._scratchBuffer, y.connect(i.ctx.destination), typeof y.start > "u" ? y.noteOn(0) : y.start(0), typeof i.ctx.resume == "function" && i.ctx.resume(), y.onended = function() {
                                y.disconnect(0), i._audioUnlocked = !0, document.removeEventListener("touchstart", a, !0), document.removeEventListener("touchend", a, !0), document.removeEventListener("click", a, !0), document.removeEventListener("keydown", a, !0);
                                for (var w = 0; w < i._howls.length; w++) i._howls[w]._emit("unlock")
                            }
                        };
                        return document.addEventListener("touchstart", a, !0), document.addEventListener("touchend", a, !0), document.addEventListener("click", a, !0), document.addEventListener("keydown", a, !0), i
                    }
                },
                _obtainHtml5Audio: function() {
                    var i = this || t;
                    if (i._html5AudioPool.length) return i._html5AudioPool.pop();
                    var a = new Audio().play();
                    return a && typeof Promise < "u" && (a instanceof Promise || typeof a.then == "function") && a.catch(function() {
                        console.warn("HTML5 Audio pool exhausted, returning potentially locked audio object.")
                    }), new Audio
                },
                _releaseHtml5Audio: function(i) {
                    var a = this || t;
                    return i._unlocked && a._html5AudioPool.push(i), a
                },
                _autoSuspend: function() {
                    var i = this;
                    if (!(!i.autoSuspend || !i.ctx || typeof i.ctx.suspend > "u" || !t.usingWebAudio)) {
                        for (var a = 0; a < i._howls.length; a++)
                            if (i._howls[a]._webAudio) {
                                for (var f = 0; f < i._howls[a]._sounds.length; f++)
                                    if (!i._howls[a]._sounds[f]._paused) return i
                            }
                        return i._suspendTimer && clearTimeout(i._suspendTimer), i._suspendTimer = setTimeout(function() {
                            if (i.autoSuspend) {
                                i._suspendTimer = null, i.state = "suspending";
                                var p = function() {
                                    i.state = "suspended", i._resumeAfterSuspend && (delete i._resumeAfterSuspend, i._autoResume())
                                };
                                i.ctx.suspend().then(p, p)
                            }
                        }, 3e4), i
                    }
                },
                _autoResume: function() {
                    var i = this;
                    if (!(!i.ctx || typeof i.ctx.resume > "u" || !t.usingWebAudio)) return i.state === "running" && i.ctx.state !== "interrupted" && i._suspendTimer ? (clearTimeout(i._suspendTimer), i._suspendTimer = null) : i.state === "suspended" || i.state === "running" && i.ctx.state === "interrupted" ? (i.ctx.resume().then(function() {
                        i.state = "running";
                        for (var a = 0; a < i._howls.length; a++) i._howls[a]._emit("resume")
                    }), i._suspendTimer && (clearTimeout(i._suspendTimer), i._suspendTimer = null)) : i.state === "suspending" && (i._resumeAfterSuspend = !0), i
                }
            };
            var t = new e,
                r = function(i) {
                    var a = this;
                    if (!i.src || i.src.length === 0) {
                        console.error("An array of source files must be passed with any new Howl.");
                        return
                    }
                    a.init(i)
                };
            r.prototype = {
                init: function(i) {
                    var a = this;
                    return t.ctx || h(), a._autoplay = i.autoplay || !1, a._format = typeof i.format != "string" ? i.format : [i.format], a._html5 = i.html5 || !1, a._muted = i.mute || !1, a._loop = i.loop || !1, a._pool = i.pool || 5, a._preload = typeof i.preload == "boolean" || i.preload === "metadata" ? i.preload : !0, a._rate = i.rate || 1, a._sprite = i.sprite || {}, a._src = typeof i.src != "string" ? i.src : [i.src], a._volume = i.volume !== void 0 ? i.volume : 1, a._xhr = {
                        method: i.xhr && i.xhr.method ? i.xhr.method : "GET",
                        headers: i.xhr && i.xhr.headers ? i.xhr.headers : null,
                        withCredentials: i.xhr && i.xhr.withCredentials ? i.xhr.withCredentials : !1
                    }, a._duration = 0, a._state = "unloaded", a._sounds = [], a._endTimers = {}, a._queue = [], a._playLock = !1, a._onend = i.onend ? [{
                        fn: i.onend
                    }] : [], a._onfade = i.onfade ? [{
                        fn: i.onfade
                    }] : [], a._onload = i.onload ? [{
                        fn: i.onload
                    }] : [], a._onloaderror = i.onloaderror ? [{
                        fn: i.onloaderror
                    }] : [], a._onplayerror = i.onplayerror ? [{
                        fn: i.onplayerror
                    }] : [], a._onpause = i.onpause ? [{
                        fn: i.onpause
                    }] : [], a._onplay = i.onplay ? [{
                        fn: i.onplay
                    }] : [], a._onstop = i.onstop ? [{
                        fn: i.onstop
                    }] : [], a._onmute = i.onmute ? [{
                        fn: i.onmute
                    }] : [], a._onvolume = i.onvolume ? [{
                        fn: i.onvolume
                    }] : [], a._onrate = i.onrate ? [{
                        fn: i.onrate
                    }] : [], a._onseek = i.onseek ? [{
                        fn: i.onseek
                    }] : [], a._onunlock = i.onunlock ? [{
                        fn: i.onunlock
                    }] : [], a._onresume = [], a._webAudio = t.usingWebAudio && !a._html5, typeof t.ctx < "u" && t.ctx && t.autoUnlock && t._unlockAudio(), t._howls.push(a), a._autoplay && a._queue.push({
                        event: "play",
                        action: function() {
                            a.play()
                        }
                    }), a._preload && a._preload !== "none" && a.load(), a
                },
                load: function() {
                    var i = this,
                        a = null;
                    if (t.noAudio) {
                        i._emit("loaderror", null, "No audio support.");
                        return
                    }
                    typeof i._src == "string" && (i._src = [i._src]);
                    for (var f = 0; f < i._src.length; f++) {
                        var p, d;
                        if (i._format && i._format[f]) p = i._format[f];
                        else {
                            if (d = i._src[f], typeof d != "string") {
                                i._emit("loaderror", null, "Non-string found in selected audio sources - ignoring.");
                                continue
                            }
                            p = /^data:audio\/([^;,]+);/i.exec(d), p || (p = /\.([^.]+)$/.exec(d.split("?", 1)[0])), p && (p = p[1].toLowerCase())
                        }
                        if (p || console.warn('No file extension was found. Consider using the "format" property or specify an extension.'), p && t.codecs(p)) {
                            a = i._src[f];
                            break
                        }
                    }
                    if (!a) {
                        i._emit("loaderror", null, "No codec support for selected audio sources.");
                        return
                    }
                    return i._src = a, i._state = "loading", window.location.protocol === "https:" && a.slice(0, 5) === "http:" && (i._html5 = !0, i._webAudio = !1), new n(i), i._webAudio && o(i), i
                },
                play: function(i, a) {
                    var f = this,
                        p = null;
                    if (typeof i == "number") p = i, i = null;
                    else {
                        if (typeof i == "string" && f._state === "loaded" && !f._sprite[i]) return null;
                        if (typeof i > "u" && (i = "__default", !f._playLock)) {
                            for (var d = 0, m = 0; m < f._sounds.length; m++) f._sounds[m]._paused && !f._sounds[m]._ended && (d++, p = f._sounds[m]._id);
                            d === 1 ? i = null : p = null
                        }
                    }
                    var g = p ? f._soundById(p) : f._inactiveSound();
                    if (!g) return null;
                    if (p && !i && (i = g._sprite || "__default"), f._state !== "loaded") {
                        g._sprite = i, g._ended = !1;
                        var v = g._id;
                        return f._queue.push({
                            event: "play",
                            action: function() {
                                f.play(v)
                            }
                        }), v
                    }
                    if (p && !g._paused) return a || f._loadQueue("play"), g._id;
                    f._webAudio && t._autoResume();
                    var y = Math.max(0, g._seek > 0 ? g._seek : f._sprite[i][0] / 1e3),
                        w = Math.max(0, (f._sprite[i][0] + f._sprite[i][1]) / 1e3 - y),
                        x = w * 1e3 / Math.abs(g._rate),
                        b = f._sprite[i][0] / 1e3,
                        A = (f._sprite[i][0] + f._sprite[i][1]) / 1e3;
                    g._sprite = i, g._ended = !1;
                    var S = function() {
                        g._paused = !1, g._seek = y, g._start = b, g._stop = A, g._loop = !!(g._loop || f._sprite[i][2])
                    };
                    if (y >= A) {
                        f._ended(g);
                        return
                    }
                    var T = g._node;
                    if (f._webAudio) {
                        var k = function() {
                            f._playLock = !1, S(), f._refreshBuffer(g);
                            var E = g._muted || f._muted ? 0 : g._volume;
                            T.gain.setValueAtTime(E, t.ctx.currentTime), g._playStart = t.ctx.currentTime, typeof T.bufferSource.start > "u" ? g._loop ? T.bufferSource.noteGrainOn(0, y, 86400) : T.bufferSource.noteGrainOn(0, y, w) : g._loop ? T.bufferSource.start(0, y, 86400) : T.bufferSource.start(0, y, w), x !== 1 / 0 && (f._endTimers[g._id] = setTimeout(f._ended.bind(f, g), x)), a || setTimeout(function() {
                                f._emit("play", g._id), f._loadQueue()
                            }, 0)
                        };
                        t.state === "running" && t.ctx.state !== "interrupted" ? k() : (f._playLock = !0, f.once("resume", k), f._clearTimer(g._id))
                    } else {
                        var C = function() {
                            T.currentTime = y, T.muted = g._muted || f._muted || t._muted || T.muted, T.volume = g._volume * t.volume(), T.playbackRate = g._rate;
                            try {
                                var E = T.play();
                                if (E && typeof Promise < "u" && (E instanceof Promise || typeof E.then == "function") ? (f._playLock = !0, S(), E.then(function() {
                                        f._playLock = !1, T._unlocked = !0, a ? f._loadQueue() : f._emit("play", g._id)
                                    }).catch(function() {
                                        f._playLock = !1, f._emit("playerror", g._id, "Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction."), g._ended = !0, g._paused = !0
                                    })) : a || (f._playLock = !1, S(), f._emit("play", g._id)), T.playbackRate = g._rate, T.paused) {
                                    f._emit("playerror", g._id, "Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction.");
                                    return
                                }
                                i !== "__default" || g._loop ? f._endTimers[g._id] = setTimeout(f._ended.bind(f, g), x) : (f._endTimers[g._id] = function() {
                                    f._ended(g), T.removeEventListener("ended", f._endTimers[g._id], !1)
                                }, T.addEventListener("ended", f._endTimers[g._id], !1))
                            } catch (H) {
                                f._emit("playerror", g._id, H)
                            }
                        };
                        T.src === "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA" && (T.src = f._src, T.load());
                        var M = window && window.ejecta || !T.readyState && t._navigator.isCocoonJS;
                        if (T.readyState >= 3 || M) C();
                        else {
                            f._playLock = !0, f._state = "loading";
                            var P = function() {
                                f._state = "loaded", C(), T.removeEventListener(t._canPlayEvent, P, !1)
                            };
                            T.addEventListener(t._canPlayEvent, P, !1), f._clearTimer(g._id)
                        }
                    }
                    return g._id
                },
                pause: function(i) {
                    var a = this;
                    if (a._state !== "loaded" || a._playLock) return a._queue.push({
                        event: "pause",
                        action: function() {
                            a.pause(i)
                        }
                    }), a;
                    for (var f = a._getSoundIds(i), p = 0; p < f.length; p++) {
                        a._clearTimer(f[p]);
                        var d = a._soundById(f[p]);
                        if (d && !d._paused && (d._seek = a.seek(f[p]), d._rateSeek = 0, d._paused = !0, a._stopFade(f[p]), d._node))
                            if (a._webAudio) {
                                if (!d._node.bufferSource) continue;
                                typeof d._node.bufferSource.stop > "u" ? d._node.bufferSource.noteOff(0) : d._node.bufferSource.stop(0), a._cleanBuffer(d._node)
                            } else(!isNaN(d._node.duration) || d._node.duration === 1 / 0) && d._node.pause();
                        arguments[1] || a._emit("pause", d ? d._id : null)
                    }
                    return a
                },
                stop: function(i, a) {
                    var f = this;
                    if (f._state !== "loaded" || f._playLock) return f._queue.push({
                        event: "stop",
                        action: function() {
                            f.stop(i)
                        }
                    }), f;
                    for (var p = f._getSoundIds(i), d = 0; d < p.length; d++) {
                        f._clearTimer(p[d]);
                        var m = f._soundById(p[d]);
                        m && (m._seek = m._start || 0, m._rateSeek = 0, m._paused = !0, m._ended = !0, f._stopFade(p[d]), m._node && (f._webAudio ? m._node.bufferSource && (typeof m._node.bufferSource.stop > "u" ? m._node.bufferSource.noteOff(0) : m._node.bufferSource.stop(0), f._cleanBuffer(m._node)) : (!isNaN(m._node.duration) || m._node.duration === 1 / 0) && (m._node.currentTime = m._start || 0, m._node.pause(), m._node.duration === 1 / 0 && f._clearSound(m._node))), a || f._emit("stop", m._id))
                    }
                    return f
                },
                mute: function(i, a) {
                    var f = this;
                    if (f._state !== "loaded" || f._playLock) return f._queue.push({
                        event: "mute",
                        action: function() {
                            f.mute(i, a)
                        }
                    }), f;
                    if (typeof a > "u")
                        if (typeof i == "boolean") f._muted = i;
                        else return f._muted;
                    for (var p = f._getSoundIds(a), d = 0; d < p.length; d++) {
                        var m = f._soundById(p[d]);
                        m && (m._muted = i, m._interval && f._stopFade(m._id), f._webAudio && m._node ? m._node.gain.setValueAtTime(i ? 0 : m._volume, t.ctx.currentTime) : m._node && (m._node.muted = t._muted ? !0 : i), f._emit("mute", m._id))
                    }
                    return f
                },
                volume: function() {
                    var i = this,
                        a = arguments,
                        f, p;
                    if (a.length === 0) return i._volume;
                    if (a.length === 1 || a.length === 2 && typeof a[1] > "u") {
                        var d = i._getSoundIds(),
                            m = d.indexOf(a[0]);
                        m >= 0 ? p = parseInt(a[0], 10) : f = parseFloat(a[0])
                    } else a.length >= 2 && (f = parseFloat(a[0]), p = parseInt(a[1], 10));
                    var g;
                    if (typeof f < "u" && f >= 0 && f <= 1) {
                        if (i._state !== "loaded" || i._playLock) return i._queue.push({
                            event: "volume",
                            action: function() {
                                i.volume.apply(i, a)
                            }
                        }), i;
                        typeof p > "u" && (i._volume = f), p = i._getSoundIds(p);
                        for (var v = 0; v < p.length; v++) g = i._soundById(p[v]), g && (g._volume = f, a[2] || i._stopFade(p[v]), i._webAudio && g._node && !g._muted ? g._node.gain.setValueAtTime(f, t.ctx.currentTime) : g._node && !g._muted && (g._node.volume = f * t.volume()), i._emit("volume", g._id))
                    } else return g = p ? i._soundById(p) : i._sounds[0], g ? g._volume : 0;
                    return i
                },
                fade: function(i, a, f, p) {
                    var d = this;
                    if (d._state !== "loaded" || d._playLock) return d._queue.push({
                        event: "fade",
                        action: function() {
                            d.fade(i, a, f, p)
                        }
                    }), d;
                    i = Math.min(Math.max(0, parseFloat(i)), 1), a = Math.min(Math.max(0, parseFloat(a)), 1), f = parseFloat(f), d.volume(i, p);
                    for (var m = d._getSoundIds(p), g = 0; g < m.length; g++) {
                        var v = d._soundById(m[g]);
                        if (v) {
                            if (p || d._stopFade(m[g]), d._webAudio && !v._muted) {
                                var y = t.ctx.currentTime,
                                    w = y + f / 1e3;
                                v._volume = i, v._node.gain.setValueAtTime(i, y), v._node.gain.linearRampToValueAtTime(a, w)
                            }
                            d._startFadeInterval(v, i, a, f, m[g], typeof p > "u")
                        }
                    }
                    return d
                },
                _startFadeInterval: function(i, a, f, p, d, m) {
                    var g = this,
                        v = a,
                        y = f - a,
                        w = Math.abs(y / .01),
                        x = Math.max(4, w > 0 ? p / w : p),
                        b = Date.now();
                    i._fadeTo = f, i._interval = setInterval(function() {
                        var A = (Date.now() - b) / p;
                        b = Date.now(), v += y * A, v = Math.round(v * 100) / 100, y < 0 ? v = Math.max(f, v) : v = Math.min(f, v), g._webAudio ? i._volume = v : g.volume(v, i._id, !0), m && (g._volume = v), (f < a && v <= f || f > a && v >= f) && (clearInterval(i._interval), i._interval = null, i._fadeTo = null, g.volume(f, i._id), g._emit("fade", i._id))
                    }, x)
                },
                _stopFade: function(i) {
                    var a = this,
                        f = a._soundById(i);
                    return f && f._interval && (a._webAudio && f._node.gain.cancelScheduledValues(t.ctx.currentTime), clearInterval(f._interval), f._interval = null, a.volume(f._fadeTo, i), f._fadeTo = null, a._emit("fade", i)), a
                },
                loop: function() {
                    var i = this,
                        a = arguments,
                        f, p, d;
                    if (a.length === 0) return i._loop;
                    if (a.length === 1)
                        if (typeof a[0] == "boolean") f = a[0], i._loop = f;
                        else return d = i._soundById(parseInt(a[0], 10)), d ? d._loop : !1;
                    else a.length === 2 && (f = a[0], p = parseInt(a[1], 10));
                    for (var m = i._getSoundIds(p), g = 0; g < m.length; g++) d = i._soundById(m[g]), d && (d._loop = f, i._webAudio && d._node && d._node.bufferSource && (d._node.bufferSource.loop = f, f && (d._node.bufferSource.loopStart = d._start || 0, d._node.bufferSource.loopEnd = d._stop, i.playing(m[g]) && (i.pause(m[g], !0), i.play(m[g], !0)))));
                    return i
                },
                rate: function() {
                    var i = this,
                        a = arguments,
                        f, p;
                    if (a.length === 0) p = i._sounds[0]._id;
                    else if (a.length === 1) {
                        var d = i._getSoundIds(),
                            m = d.indexOf(a[0]);
                        m >= 0 ? p = parseInt(a[0], 10) : f = parseFloat(a[0])
                    } else a.length === 2 && (f = parseFloat(a[0]), p = parseInt(a[1], 10));
                    var g;
                    if (typeof f == "number") {
                        if (i._state !== "loaded" || i._playLock) return i._queue.push({
                            event: "rate",
                            action: function() {
                                i.rate.apply(i, a)
                            }
                        }), i;
                        typeof p > "u" && (i._rate = f), p = i._getSoundIds(p);
                        for (var v = 0; v < p.length; v++)
                            if (g = i._soundById(p[v]), g) {
                                i.playing(p[v]) && (g._rateSeek = i.seek(p[v]), g._playStart = i._webAudio ? t.ctx.currentTime : g._playStart), g._rate = f, i._webAudio && g._node && g._node.bufferSource ? g._node.bufferSource.playbackRate.setValueAtTime(f, t.ctx.currentTime) : g._node && (g._node.playbackRate = f);
                                var y = i.seek(p[v]),
                                    w = (i._sprite[g._sprite][0] + i._sprite[g._sprite][1]) / 1e3 - y,
                                    x = w * 1e3 / Math.abs(g._rate);
                                (i._endTimers[p[v]] || !g._paused) && (i._clearTimer(p[v]), i._endTimers[p[v]] = setTimeout(i._ended.bind(i, g), x)), i._emit("rate", g._id)
                            }
                    } else return g = i._soundById(p), g ? g._rate : i._rate;
                    return i
                },
                seek: function() {
                    var i = this,
                        a = arguments,
                        f, p;
                    if (a.length === 0) i._sounds.length && (p = i._sounds[0]._id);
                    else if (a.length === 1) {
                        var d = i._getSoundIds(),
                            m = d.indexOf(a[0]);
                        m >= 0 ? p = parseInt(a[0], 10) : i._sounds.length && (p = i._sounds[0]._id, f = parseFloat(a[0]))
                    } else a.length === 2 && (f = parseFloat(a[0]), p = parseInt(a[1], 10));
                    if (typeof p > "u") return 0;
                    if (typeof f == "number" && (i._state !== "loaded" || i._playLock)) return i._queue.push({
                        event: "seek",
                        action: function() {
                            i.seek.apply(i, a)
                        }
                    }), i;
                    var g = i._soundById(p);
                    if (g)
                        if (typeof f == "number" && f >= 0) {
                            var v = i.playing(p);
                            v && i.pause(p, !0), g._seek = f, g._ended = !1, i._clearTimer(p), !i._webAudio && g._node && !isNaN(g._node.duration) && (g._node.currentTime = f);
                            var y = function() {
                                v && i.play(p, !0), i._emit("seek", p)
                            };
                            if (v && !i._webAudio) {
                                var w = function() {
                                    i._playLock ? setTimeout(w, 0) : y()
                                };
                                setTimeout(w, 0)
                            } else y()
                        } else if (i._webAudio) {
                        var x = i.playing(p) ? t.ctx.currentTime - g._playStart : 0,
                            b = g._rateSeek ? g._rateSeek - g._seek : 0;
                        return g._seek + (b + x * Math.abs(g._rate))
                    } else return g._node.currentTime;
                    return i
                },
                playing: function(i) {
                    var a = this;
                    if (typeof i == "number") {
                        var f = a._soundById(i);
                        return f ? !f._paused : !1
                    }
                    for (var p = 0; p < a._sounds.length; p++)
                        if (!a._sounds[p]._paused) return !0;
                    return !1
                },
                duration: function(i) {
                    var a = this,
                        f = a._duration,
                        p = a._soundById(i);
                    return p && (f = a._sprite[p._sprite][1] / 1e3), f
                },
                state: function() {
                    return this._state
                },
                unload: function() {
                    for (var i = this, a = i._sounds, f = 0; f < a.length; f++) a[f]._paused || i.stop(a[f]._id), i._webAudio || (i._clearSound(a[f]._node), a[f]._node.removeEventListener("error", a[f]._errorFn, !1), a[f]._node.removeEventListener(t._canPlayEvent, a[f]._loadFn, !1), a[f]._node.removeEventListener("ended", a[f]._endFn, !1), t._releaseHtml5Audio(a[f]._node)), delete a[f]._node, i._clearTimer(a[f]._id);
                    var p = t._howls.indexOf(i);
                    p >= 0 && t._howls.splice(p, 1);
                    var d = !0;
                    for (f = 0; f < t._howls.length; f++)
                        if (t._howls[f]._src === i._src || i._src.indexOf(t._howls[f]._src) >= 0) {
                            d = !1;
                            break
                        }
                    return s && d && delete s[i._src], t.noAudio = !1, i._state = "unloaded", i._sounds = [], i = null, null
                },
                on: function(i, a, f, p) {
                    var d = this,
                        m = d["_on" + i];
                    return typeof a == "function" && m.push(p ? {
                        id: f,
                        fn: a,
                        once: p
                    } : {
                        id: f,
                        fn: a
                    }), d
                },
                off: function(i, a, f) {
                    var p = this,
                        d = p["_on" + i],
                        m = 0;
                    if (typeof a == "number" && (f = a, a = null), a || f)
                        for (m = 0; m < d.length; m++) {
                            var g = f === d[m].id;
                            if (a === d[m].fn && g || !a && g) {
                                d.splice(m, 1);
                                break
                            }
                        } else if (i) p["_on" + i] = [];
                        else {
                            var v = Object.keys(p);
                            for (m = 0; m < v.length; m++) v[m].indexOf("_on") === 0 && Array.isArray(p[v[m]]) && (p[v[m]] = [])
                        }
                    return p
                },
                once: function(i, a, f) {
                    var p = this;
                    return p.on(i, a, f, 1), p
                },
                _emit: function(i, a, f) {
                    for (var p = this, d = p["_on" + i], m = d.length - 1; m >= 0; m--)(!d[m].id || d[m].id === a || i === "load") && (setTimeout((function(g) {
                        g.call(this, a, f)
                    }).bind(p, d[m].fn), 0), d[m].once && p.off(i, d[m].fn, d[m].id));
                    return p._loadQueue(i), p
                },
                _loadQueue: function(i) {
                    var a = this;
                    if (a._queue.length > 0) {
                        var f = a._queue[0];
                        f.event === i && (a._queue.shift(), a._loadQueue()), i || f.action()
                    }
                    return a
                },
                _ended: function(i) {
                    var a = this,
                        f = i._sprite;
                    if (!a._webAudio && i._node && !i._node.paused && !i._node.ended && i._node.currentTime < i._stop) return setTimeout(a._ended.bind(a, i), 100), a;
                    var p = !!(i._loop || a._sprite[f][2]);
                    if (a._emit("end", i._id), !a._webAudio && p && a.stop(i._id, !0).play(i._id), a._webAudio && p) {
                        a._emit("play", i._id), i._seek = i._start || 0, i._rateSeek = 0, i._playStart = t.ctx.currentTime;
                        var d = (i._stop - i._start) * 1e3 / Math.abs(i._rate);
                        a._endTimers[i._id] = setTimeout(a._ended.bind(a, i), d)
                    }
                    return a._webAudio && !p && (i._paused = !0, i._ended = !0, i._seek = i._start || 0, i._rateSeek = 0, a._clearTimer(i._id), a._cleanBuffer(i._node), t._autoSuspend()), !a._webAudio && !p && a.stop(i._id, !0), a
                },
                _clearTimer: function(i) {
                    var a = this;
                    if (a._endTimers[i]) {
                        if (typeof a._endTimers[i] != "function") clearTimeout(a._endTimers[i]);
                        else {
                            var f = a._soundById(i);
                            f && f._node && f._node.removeEventListener("ended", a._endTimers[i], !1)
                        }
                        delete a._endTimers[i]
                    }
                    return a
                },
                _soundById: function(i) {
                    for (var a = this, f = 0; f < a._sounds.length; f++)
                        if (i === a._sounds[f]._id) return a._sounds[f];
                    return null
                },
                _inactiveSound: function() {
                    var i = this;
                    i._drain();
                    for (var a = 0; a < i._sounds.length; a++)
                        if (i._sounds[a]._ended) return i._sounds[a].reset();
                    return new n(i)
                },
                _drain: function() {
                    var i = this,
                        a = i._pool,
                        f = 0,
                        p = 0;
                    if (!(i._sounds.length < a)) {
                        for (p = 0; p < i._sounds.length; p++) i._sounds[p]._ended && f++;
                        for (p = i._sounds.length - 1; p >= 0; p--) {
                            if (f <= a) return;
                            i._sounds[p]._ended && (i._webAudio && i._sounds[p]._node && i._sounds[p]._node.disconnect(0), i._sounds.splice(p, 1), f--)
                        }
                    }
                },
                _getSoundIds: function(i) {
                    var a = this;
                    if (typeof i > "u") {
                        for (var f = [], p = 0; p < a._sounds.length; p++) f.push(a._sounds[p]._id);
                        return f
                    } else return [i]
                },
                _refreshBuffer: function(i) {
                    var a = this;
                    return i._node.bufferSource = t.ctx.createBufferSource(), i._node.bufferSource.buffer = s[a._src], i._panner ? i._node.bufferSource.connect(i._panner) : i._node.bufferSource.connect(i._node), i._node.bufferSource.loop = i._loop, i._loop && (i._node.bufferSource.loopStart = i._start || 0, i._node.bufferSource.loopEnd = i._stop || 0), i._node.bufferSource.playbackRate.setValueAtTime(i._rate, t.ctx.currentTime), a
                },
                _cleanBuffer: function(i) {
                    var a = this,
                        f = t._navigator && t._navigator.vendor.indexOf("Apple") >= 0;
                    if (!i.bufferSource) return a;
                    if (t._scratchBuffer && i.bufferSource && (i.bufferSource.onended = null, i.bufferSource.disconnect(0), f)) try {
                        i.bufferSource.buffer = t._scratchBuffer
                    } catch {}
                    return i.bufferSource = null, a
                },
                _clearSound: function(i) {
                    var a = /MSIE |Trident\//.test(t._navigator && t._navigator.userAgent);
                    a || (i.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA")
                }
            };
            var n = function(i) {
                this._parent = i, this.init()
            };
            n.prototype = {
                init: function() {
                    var i = this,
                        a = i._parent;
                    return i._muted = a._muted, i._loop = a._loop, i._volume = a._volume, i._rate = a._rate, i._seek = 0, i._paused = !0, i._ended = !0, i._sprite = "__default", i._id = ++t._counter, a._sounds.push(i), i.create(), i
                },
                create: function() {
                    var i = this,
                        a = i._parent,
                        f = t._muted || i._muted || i._parent._muted ? 0 : i._volume;
                    return a._webAudio ? (i._node = typeof t.ctx.createGain > "u" ? t.ctx.createGainNode() : t.ctx.createGain(), i._node.gain.setValueAtTime(f, t.ctx.currentTime), i._node.paused = !0, i._node.connect(t.masterGain)) : t.noAudio || (i._node = t._obtainHtml5Audio(), i._errorFn = i._errorListener.bind(i), i._node.addEventListener("error", i._errorFn, !1), i._loadFn = i._loadListener.bind(i), i._node.addEventListener(t._canPlayEvent, i._loadFn, !1), i._endFn = i._endListener.bind(i), i._node.addEventListener("ended", i._endFn, !1), i._node.src = a._src, i._node.preload = a._preload === !0 ? "auto" : a._preload, i._node.volume = f * t.volume(), i._node.load()), i
                },
                reset: function() {
                    var i = this,
                        a = i._parent;
                    return i._muted = a._muted, i._loop = a._loop, i._volume = a._volume, i._rate = a._rate, i._seek = 0, i._rateSeek = 0, i._paused = !0, i._ended = !0, i._sprite = "__default", i._id = ++t._counter, i
                },
                _errorListener: function() {
                    var i = this;
                    i._parent._emit("loaderror", i._id, i._node.error ? i._node.error.code : 0), i._node.removeEventListener("error", i._errorFn, !1)
                },
                _loadListener: function() {
                    var i = this,
                        a = i._parent;
                    a._duration = Math.ceil(i._node.duration * 10) / 10, Object.keys(a._sprite).length === 0 && (a._sprite = {
                        __default: [0, a._duration * 1e3]
                    }), a._state !== "loaded" && (a._state = "loaded", a._emit("load"), a._loadQueue()), i._node.removeEventListener(t._canPlayEvent, i._loadFn, !1)
                },
                _endListener: function() {
                    var i = this,
                        a = i._parent;
                    a._duration === 1 / 0 && (a._duration = Math.ceil(i._node.duration * 10) / 10, a._sprite.__default[1] === 1 / 0 && (a._sprite.__default[1] = a._duration * 1e3), a._ended(i)), i._node.removeEventListener("ended", i._endFn, !1)
                }
            };
            var s = {},
                o = function(i) {
                    var a = i._src;
                    if (s[a]) {
                        i._duration = s[a].duration, l(i);
                        return
                    }
                    if (/^data:[^;]+;base64,/.test(a)) {
                        for (var f = atob(a.split(",")[1]), p = new Uint8Array(f.length), d = 0; d < f.length; ++d) p[d] = f.charCodeAt(d);
                        _(p.buffer, i)
                    } else {
                        var m = new XMLHttpRequest;
                        m.open(i._xhr.method, a, !0), m.withCredentials = i._xhr.withCredentials, m.responseType = "arraybuffer", i._xhr.headers && Object.keys(i._xhr.headers).forEach(function(g) {
                            m.setRequestHeader(g, i._xhr.headers[g])
                        }), m.onload = function() {
                            var g = (m.status + "")[0];
                            if (g !== "0" && g !== "2" && g !== "3") {
                                i._emit("loaderror", null, "Failed loading audio file with status: " + m.status + ".");
                                return
                            }
                            _(m.response, i)
                        }, m.onerror = function() {
                            i._webAudio && (i._html5 = !0, i._webAudio = !1, i._sounds = [], delete s[a], i.load())
                        }, u(m)
                    }
                },
                u = function(i) {
                    try {
                        i.send()
                    } catch {
                        i.onerror()
                    }
                },
                _ = function(i, a) {
                    var f = function() {
                            a._emit("loaderror", null, "Decoding audio data failed.")
                        },
                        p = function(d) {
                            d && a._sounds.length > 0 ? (s[a._src] = d, l(a, d)) : f()
                        };
                    typeof Promise < "u" && t.ctx.decodeAudioData.length === 1 ? t.ctx.decodeAudioData(i).then(p).catch(f) : t.ctx.decodeAudioData(i, p, f)
                },
                l = function(i, a) {
                    a && !i._duration && (i._duration = a.duration), Object.keys(i._sprite).length === 0 && (i._sprite = {
                        __default: [0, i._duration * 1e3]
                    }), i._state !== "loaded" && (i._state = "loaded", i._emit("load"), i._loadQueue())
                },
                h = function() {
                    if (t.usingWebAudio) {
                        try {
                            typeof AudioContext < "u" ? t.ctx = new AudioContext : typeof webkitAudioContext < "u" ? t.ctx = new webkitAudioContext : t.usingWebAudio = !1
                        } catch {
                            t.usingWebAudio = !1
                        }
                        t.ctx || (t.usingWebAudio = !1);
                        var i = /iP(hone|od|ad)/.test(t._navigator && t._navigator.platform),
                            a = t._navigator && t._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/),
                            f = a ? parseInt(a[1], 10) : null;
                        if (i && f && f < 9) {
                            var p = /safari/.test(t._navigator && t._navigator.userAgent.toLowerCase());
                            t._navigator && !p && (t.usingWebAudio = !1)
                        }
                        t.usingWebAudio && (t.masterGain = typeof t.ctx.createGain > "u" ? t.ctx.createGainNode() : t.ctx.createGain(), t.masterGain.gain.setValueAtTime(t._muted ? 0 : t._volume, t.ctx.currentTime), t.masterGain.connect(t.ctx.destination)), t._setup()
                    }
                };
            c.Howler = t, c.Howl = r, typeof et < "u" ? (et.HowlerGlobal = e, et.Howler = t, et.Howl = r, et.Sound = n) : typeof window < "u" && (window.HowlerGlobal = e, window.Howler = t, window.Howl = r, window.Sound = n)
        })();
        (function() {
            HowlerGlobal.prototype._pos = [0, 0, 0], HowlerGlobal.prototype._orientation = [0, 0, -1, 0, 1, 0], HowlerGlobal.prototype.stereo = function(t) {
                var r = this;
                if (!r.ctx || !r.ctx.listener) return r;
                for (var n = r._howls.length - 1; n >= 0; n--) r._howls[n].stereo(t);
                return r
            }, HowlerGlobal.prototype.pos = function(t, r, n) {
                var s = this;
                if (!s.ctx || !s.ctx.listener) return s;
                if (r = typeof r != "number" ? s._pos[1] : r, n = typeof n != "number" ? s._pos[2] : n, typeof t == "number") s._pos = [t, r, n], typeof s.ctx.listener.positionX < "u" ? (s.ctx.listener.positionX.setTargetAtTime(s._pos[0], Howler.ctx.currentTime, .1), s.ctx.listener.positionY.setTargetAtTime(s._pos[1], Howler.ctx.currentTime, .1), s.ctx.listener.positionZ.setTargetAtTime(s._pos[2], Howler.ctx.currentTime, .1)) : s.ctx.listener.setPosition(s._pos[0], s._pos[1], s._pos[2]);
                else return s._pos;
                return s
            }, HowlerGlobal.prototype.orientation = function(t, r, n, s, o, u) {
                var _ = this;
                if (!_.ctx || !_.ctx.listener) return _;
                var l = _._orientation;
                if (r = typeof r != "number" ? l[1] : r, n = typeof n != "number" ? l[2] : n, s = typeof s != "number" ? l[3] : s, o = typeof o != "number" ? l[4] : o, u = typeof u != "number" ? l[5] : u, typeof t == "number") _._orientation = [t, r, n, s, o, u], typeof _.ctx.listener.forwardX < "u" ? (_.ctx.listener.forwardX.setTargetAtTime(t, Howler.ctx.currentTime, .1), _.ctx.listener.forwardY.setTargetAtTime(r, Howler.ctx.currentTime, .1), _.ctx.listener.forwardZ.setTargetAtTime(n, Howler.ctx.currentTime, .1), _.ctx.listener.upX.setTargetAtTime(s, Howler.ctx.currentTime, .1), _.ctx.listener.upY.setTargetAtTime(o, Howler.ctx.currentTime, .1), _.ctx.listener.upZ.setTargetAtTime(u, Howler.ctx.currentTime, .1)) : _.ctx.listener.setOrientation(t, r, n, s, o, u);
                else return l;
                return _
            }, Howl.prototype.init = (function(t) {
                return function(r) {
                    var n = this;
                    return n._orientation = r.orientation || [1, 0, 0], n._stereo = r.stereo || null, n._pos = r.pos || null, n._pannerAttr = {
                        coneInnerAngle: typeof r.coneInnerAngle < "u" ? r.coneInnerAngle : 360,
                        coneOuterAngle: typeof r.coneOuterAngle < "u" ? r.coneOuterAngle : 360,
                        coneOuterGain: typeof r.coneOuterGain < "u" ? r.coneOuterGain : 0,
                        distanceModel: typeof r.distanceModel < "u" ? r.distanceModel : "inverse",
                        maxDistance: typeof r.maxDistance < "u" ? r.maxDistance : 1e4,
                        panningModel: typeof r.panningModel < "u" ? r.panningModel : "HRTF",
                        refDistance: typeof r.refDistance < "u" ? r.refDistance : 1,
                        rolloffFactor: typeof r.rolloffFactor < "u" ? r.rolloffFactor : 1
                    }, n._onstereo = r.onstereo ? [{
                        fn: r.onstereo
                    }] : [], n._onpos = r.onpos ? [{
                        fn: r.onpos
                    }] : [], n._onorientation = r.onorientation ? [{
                        fn: r.onorientation
                    }] : [], t.call(this, r)
                }
            })(Howl.prototype.init), Howl.prototype.stereo = function(t, r) {
                var n = this;
                if (!n._webAudio) return n;
                if (n._state !== "loaded") return n._queue.push({
                    event: "stereo",
                    action: function() {
                        n.stereo(t, r)
                    }
                }), n;
                var s = typeof Howler.ctx.createStereoPanner > "u" ? "spatial" : "stereo";
                if (typeof r > "u")
                    if (typeof t == "number") n._stereo = t, n._pos = [t, 0, 0];
                    else return n._stereo;
                for (var o = n._getSoundIds(r), u = 0; u < o.length; u++) {
                    var _ = n._soundById(o[u]);
                    if (_)
                        if (typeof t == "number") _._stereo = t, _._pos = [t, 0, 0], _._node && (_._pannerAttr.panningModel = "equalpower", (!_._panner || !_._panner.pan) && e(_, s), s === "spatial" ? typeof _._panner.positionX < "u" ? (_._panner.positionX.setValueAtTime(t, Howler.ctx.currentTime), _._panner.positionY.setValueAtTime(0, Howler.ctx.currentTime), _._panner.positionZ.setValueAtTime(0, Howler.ctx.currentTime)) : _._panner.setPosition(t, 0, 0) : _._panner.pan.setValueAtTime(t, Howler.ctx.currentTime)), n._emit("stereo", _._id);
                        else return _._stereo
                }
                return n
            }, Howl.prototype.pos = function(t, r, n, s) {
                var o = this;
                if (!o._webAudio) return o;
                if (o._state !== "loaded") return o._queue.push({
                    event: "pos",
                    action: function() {
                        o.pos(t, r, n, s)
                    }
                }), o;
                if (r = typeof r != "number" ? 0 : r, n = typeof n != "number" ? -.5 : n, typeof s > "u")
                    if (typeof t == "number") o._pos = [t, r, n];
                    else return o._pos;
                for (var u = o._getSoundIds(s), _ = 0; _ < u.length; _++) {
                    var l = o._soundById(u[_]);
                    if (l)
                        if (typeof t == "number") l._pos = [t, r, n], l._node && ((!l._panner || l._panner.pan) && e(l, "spatial"), typeof l._panner.positionX < "u" ? (l._panner.positionX.setValueAtTime(t, Howler.ctx.currentTime), l._panner.positionY.setValueAtTime(r, Howler.ctx.currentTime), l._panner.positionZ.setValueAtTime(n, Howler.ctx.currentTime)) : l._panner.setPosition(t, r, n)), o._emit("pos", l._id);
                        else return l._pos
                }
                return o
            }, Howl.prototype.orientation = function(t, r, n, s) {
                var o = this;
                if (!o._webAudio) return o;
                if (o._state !== "loaded") return o._queue.push({
                    event: "orientation",
                    action: function() {
                        o.orientation(t, r, n, s)
                    }
                }), o;
                if (r = typeof r != "number" ? o._orientation[1] : r, n = typeof n != "number" ? o._orientation[2] : n, typeof s > "u")
                    if (typeof t == "number") o._orientation = [t, r, n];
                    else return o._orientation;
                for (var u = o._getSoundIds(s), _ = 0; _ < u.length; _++) {
                    var l = o._soundById(u[_]);
                    if (l)
                        if (typeof t == "number") l._orientation = [t, r, n], l._node && (l._panner || (l._pos || (l._pos = o._pos || [0, 0, -.5]), e(l, "spatial")), typeof l._panner.orientationX < "u" ? (l._panner.orientationX.setValueAtTime(t, Howler.ctx.currentTime), l._panner.orientationY.setValueAtTime(r, Howler.ctx.currentTime), l._panner.orientationZ.setValueAtTime(n, Howler.ctx.currentTime)) : l._panner.setOrientation(t, r, n)), o._emit("orientation", l._id);
                        else return l._orientation
                }
                return o
            }, Howl.prototype.pannerAttr = function() {
                var t = this,
                    r = arguments,
                    n, s, o;
                if (!t._webAudio) return t;
                if (r.length === 0) return t._pannerAttr;
                if (r.length === 1)
                    if (typeof r[0] == "object") n = r[0], typeof s > "u" && (n.pannerAttr || (n.pannerAttr = {
                        coneInnerAngle: n.coneInnerAngle,
                        coneOuterAngle: n.coneOuterAngle,
                        coneOuterGain: n.coneOuterGain,
                        distanceModel: n.distanceModel,
                        maxDistance: n.maxDistance,
                        refDistance: n.refDistance,
                        rolloffFactor: n.rolloffFactor,
                        panningModel: n.panningModel
                    }), t._pannerAttr = {
                        coneInnerAngle: typeof n.pannerAttr.coneInnerAngle < "u" ? n.pannerAttr.coneInnerAngle : t._coneInnerAngle,
                        coneOuterAngle: typeof n.pannerAttr.coneOuterAngle < "u" ? n.pannerAttr.coneOuterAngle : t._coneOuterAngle,
                        coneOuterGain: typeof n.pannerAttr.coneOuterGain < "u" ? n.pannerAttr.coneOuterGain : t._coneOuterGain,
                        distanceModel: typeof n.pannerAttr.distanceModel < "u" ? n.pannerAttr.distanceModel : t._distanceModel,
                        maxDistance: typeof n.pannerAttr.maxDistance < "u" ? n.pannerAttr.maxDistance : t._maxDistance,
                        refDistance: typeof n.pannerAttr.refDistance < "u" ? n.pannerAttr.refDistance : t._refDistance,
                        rolloffFactor: typeof n.pannerAttr.rolloffFactor < "u" ? n.pannerAttr.rolloffFactor : t._rolloffFactor,
                        panningModel: typeof n.pannerAttr.panningModel < "u" ? n.pannerAttr.panningModel : t._panningModel
                    });
                    else return o = t._soundById(parseInt(r[0], 10)), o ? o._pannerAttr : t._pannerAttr;
                else r.length === 2 && (n = r[0], s = parseInt(r[1], 10));
                for (var u = t._getSoundIds(s), _ = 0; _ < u.length; _++)
                    if (o = t._soundById(u[_]), o) {
                        var l = o._pannerAttr;
                        l = {
                            coneInnerAngle: typeof n.coneInnerAngle < "u" ? n.coneInnerAngle : l.coneInnerAngle,
                            coneOuterAngle: typeof n.coneOuterAngle < "u" ? n.coneOuterAngle : l.coneOuterAngle,
                            coneOuterGain: typeof n.coneOuterGain < "u" ? n.coneOuterGain : l.coneOuterGain,
                            distanceModel: typeof n.distanceModel < "u" ? n.distanceModel : l.distanceModel,
                            maxDistance: typeof n.maxDistance < "u" ? n.maxDistance : l.maxDistance,
                            refDistance: typeof n.refDistance < "u" ? n.refDistance : l.refDistance,
                            rolloffFactor: typeof n.rolloffFactor < "u" ? n.rolloffFactor : l.rolloffFactor,
                            panningModel: typeof n.panningModel < "u" ? n.panningModel : l.panningModel
                        };
                        var h = o._panner;
                        h || (o._pos || (o._pos = t._pos || [0, 0, -.5]), e(o, "spatial"), h = o._panner), h.coneInnerAngle = l.coneInnerAngle, h.coneOuterAngle = l.coneOuterAngle, h.coneOuterGain = l.coneOuterGain, h.distanceModel = l.distanceModel, h.maxDistance = l.maxDistance, h.refDistance = l.refDistance, h.rolloffFactor = l.rolloffFactor, h.panningModel = l.panningModel
                    }
                return t
            }, Sound.prototype.init = (function(t) {
                return function() {
                    var r = this,
                        n = r._parent;
                    r._orientation = n._orientation, r._stereo = n._stereo, r._pos = n._pos, r._pannerAttr = n._pannerAttr, t.call(this), r._stereo ? n.stereo(r._stereo) : r._pos && n.pos(r._pos[0], r._pos[1], r._pos[2], r._id)
                }
            })(Sound.prototype.init), Sound.prototype.reset = (function(t) {
                return function() {
                    var r = this,
                        n = r._parent;
                    return r._orientation = n._orientation, r._stereo = n._stereo, r._pos = n._pos, r._pannerAttr = n._pannerAttr, r._stereo ? n.stereo(r._stereo) : r._pos ? n.pos(r._pos[0], r._pos[1], r._pos[2], r._id) : r._panner && (r._panner.disconnect(0), r._panner = void 0, n._refreshBuffer(r)), t.call(this)
                }
            })(Sound.prototype.reset);
            var e = function(t, r) {
                r = r || "spatial", r === "spatial" ? (t._panner = Howler.ctx.createPanner(), t._panner.coneInnerAngle = t._pannerAttr.coneInnerAngle, t._panner.coneOuterAngle = t._pannerAttr.coneOuterAngle, t._panner.coneOuterGain = t._pannerAttr.coneOuterGain, t._panner.distanceModel = t._pannerAttr.distanceModel, t._panner.maxDistance = t._pannerAttr.maxDistance, t._panner.refDistance = t._pannerAttr.refDistance, t._panner.rolloffFactor = t._pannerAttr.rolloffFactor, t._panner.panningModel = t._pannerAttr.panningModel, typeof t._panner.positionX < "u" ? (t._panner.positionX.setValueAtTime(t._pos[0], Howler.ctx.currentTime), t._panner.positionY.setValueAtTime(t._pos[1], Howler.ctx.currentTime), t._panner.positionZ.setValueAtTime(t._pos[2], Howler.ctx.currentTime)) : t._panner.setPosition(t._pos[0], t._pos[1], t._pos[2]), typeof t._panner.orientationX < "u" ? (t._panner.orientationX.setValueAtTime(t._orientation[0], Howler.ctx.currentTime), t._panner.orientationY.setValueAtTime(t._orientation[1], Howler.ctx.currentTime), t._panner.orientationZ.setValueAtTime(t._orientation[2], Howler.ctx.currentTime)) : t._panner.setOrientation(t._orientation[0], t._orientation[1], t._orientation[2])) : (t._panner = Howler.ctx.createStereoPanner(), t._panner.pan.setValueAtTime(t._stereo, Howler.ctx.currentTime)), t._panner.connect(t._node), t._paused || t._parent.pause(t._id, !0).play(t._id, !0)
            }
        })()
    })(Ct)), Ct
}
var ns = Ln();

function me(c) {
    if (c === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    return c
}

function Br(c, e) {
    c.prototype = Object.create(e.prototype), c.prototype.constructor = c, c.__proto__ = e
}
var ie = {
        autoSleep: 120,
        force3D: "auto",
        nullTargetWarn: 1,
        units: {
            lineHeight: ""
        }
    },
    We = {
        duration: .5,
        overwrite: !1,
        delay: 0
    },
    Jt, q, F, ue = 1e8,
    I = 1 / ue,
    Gt = Math.PI * 2,
    Bn = Gt / 4,
    Vn = 0,
    Vr = Math.sqrt,
    Gn = Math.cos,
    Hn = Math.sin,
    Y = function(e) {
        return typeof e == "string"
    },
    V = function(e) {
        return typeof e == "function"
    },
    ve = function(e) {
        return typeof e == "number"
    },
    er = function(e) {
        return typeof e > "u"
    },
    he = function(e) {
        return typeof e == "object"
    },
    Q = function(e) {
        return e !== !1
    },
    tr = function() {
        return typeof window < "u"
    },
    mt = function(e) {
        return V(e) || Y(e)
    },
    Gr = typeof ArrayBuffer == "function" && ArrayBuffer.isView || function() {},
    U = Array.isArray,
    zn = /random\([^)]+\)/g,
    Nn = /,\s*/g,
    yr = /(?:-?\.?\d|\.)+/gi,
    Hr = /[-+=.]*\d+[.e\-+]*\d*[e\-+]*\d*/g,
    ze = /[-+=.]*\d+[.e-]*\d*[a-z%]*/g,
    Dt = /[-+=.]*\d+\.?\d*(?:e-|e\+)?\d*/gi,
    zr = /[+-]=-?[.\d]+/,
    Xn = /[^,'"\[\]\s]+/gi,
    Yn = /^[+\-=e\s\d]*\d+[.\d]*([a-z]*|%)\s*$/i,
    L, le, Ht, rr, se = {},
    Tt = {},
    Nr, Xr = function(e) {
        return (Tt = Ue(e, se)) && J
    },
    nr = function(e, t) {
        return console.warn("Invalid property", e, "set to", t, "Missing plugin? gsap.registerPlugin()")
    },
    ot = function(e, t) {
        return !t && console.warn(e)
    },
    Yr = function(e, t) {
        return e && (se[e] = t) && Tt && (Tt[e] = t) || se
    },
    ut = function() {
        return 0
    },
    qn = {
        suppressEvents: !0,
        isStart: !0,
        kill: !1
    },
    gt = {
        suppressEvents: !0,
        kill: !1
    },
    Wn = {
        suppressEvents: !0
    },
    ir = {},
    be = [],
    zt = {},
    qr, ee = {},
    It = {},
    Tr = 30,
    vt = [],
    sr = "",
    ar = function(e) {
        var t = e[0],
            r, n;
        if (he(t) || V(t) || (e = [e]), !(r = (t._gsap || {}).harness)) {
            for (n = vt.length; n-- && !vt[n].targetTest(t););
            r = vt[n]
        }
        for (n = e.length; n--;) e[n] && (e[n]._gsap || (e[n]._gsap = new mn(e[n], r))) || e.splice(n, 1);
        return e
    },
    Re = function(e) {
        return e._gsap || ar(fe(e))[0]._gsap
    },
    Wr = function(e, t, r) {
        return (r = e[t]) && V(r) ? e[t]() : er(r) && e.getAttribute && e.getAttribute(t) || r
    },
    Z = function(e, t) {
        return (e = e.split(",")).forEach(t) || e
    },
    G = function(e) {
        return Math.round(e * 1e5) / 1e5 || 0
    },
    R = function(e) {
        return Math.round(e * 1e7) / 1e7 || 0
    },
    Xe = function(e, t) {
        var r = t.charAt(0),
            n = parseFloat(t.substr(2));
        return e = parseFloat(e), r === "+" ? e + n : r === "-" ? e - n : r === "*" ? e * n : e / n
    },
    Un = function(e, t) {
        for (var r = t.length, n = 0; e.indexOf(t[n]) < 0 && ++n < r;);
        return n < r
    },
    xt = function() {
        var e = be.length,
            t = be.slice(0),
            r, n;
        for (zt = {}, be.length = 0, r = 0; r < e; r++) n = t[r], n && n._lazy && (n.render(n._lazy[0], n._lazy[1], !0)._lazy = 0)
    },
    or = function(e) {
        return !!(e._initted || e._startAt || e.add)
    },
    Ur = function(e, t, r, n) {
        be.length && !q && xt(), e.render(t, r, !!(q && t < 0 && or(e))), be.length && !q && xt()
    },
    $r = function(e) {
        var t = parseFloat(e);
        return (t || t === 0) && (e + "").match(Xn).length < 2 ? t : Y(e) ? e.trim() : e
    },
    Qr = function(e) {
        return e
    },
    ae = function(e, t) {
        for (var r in t) r in e || (e[r] = t[r]);
        return e
    },
    $n = function(e) {
        return function(t, r) {
            for (var n in r) n in t || n === "duration" && e || n === "ease" || (t[n] = r[n])
        }
    },
    Ue = function(e, t) {
        for (var r in t) e[r] = t[r];
        return e
    },
    xr = function c(e, t) {
        for (var r in t) r !== "__proto__" && r !== "constructor" && r !== "prototype" && (e[r] = he(t[r]) ? c(e[r] || (e[r] = {}), t[r]) : t[r]);
        return e
    },
    wt = function(e, t) {
        var r = {},
            n;
        for (n in e) n in t || (r[n] = e[n]);
        return r
    },
    it = function(e) {
        var t = e.parent || L,
            r = e.keyframes ? $n(U(e.keyframes)) : ae;
        if (Q(e.inherit))
            for (; t;) r(e, t.vars.defaults), t = t.parent || t._dp;
        return e
    },
    Qn = function(e, t) {
        for (var r = e.length, n = r === t.length; n && r-- && e[r] === t[r];);
        return r < 0
    },
    Zr = function(e, t, r, n, s) {
        var o = e[n],
            u;
        if (s)
            for (u = t[s]; o && o[s] > u;) o = o._prev;
        return o ? (t._next = o._next, o._next = t) : (t._next = e[r], e[r] = t), t._next ? t._next._prev = t : e[n] = t, t._prev = o, t.parent = t._dp = e, t
    },
    Ot = function(e, t, r, n) {
        r === void 0 && (r = "_first"), n === void 0 && (n = "_last");
        var s = t._prev,
            o = t._next;
        s ? s._next = o : e[r] === t && (e[r] = o), o ? o._prev = s : e[n] === t && (e[n] = s), t._next = t._prev = t.parent = null
    },
    Se = function(e, t) {
        e.parent && (!t || e.parent.autoRemoveChildren) && e.parent.remove && e.parent.remove(e), e._act = 0
    },
    Le = function(e, t) {
        if (e && (!t || t._end > e._dur || t._start < 0))
            for (var r = e; r;) r._dirty = 1, r = r.parent;
        return e
    },
    Zn = function(e) {
        for (var t = e.parent; t && t.parent;) t._dirty = 1, t.totalDuration(), t = t.parent;
        return e
    },
    Nt = function(e, t, r, n) {
        return e._startAt && (q ? e._startAt.revert(gt) : e.vars.immediateRender && !e.vars.autoRevert || e._startAt.render(t, !0, n))
    },
    Kn = function c(e) {
        return !e || e._ts && c(e.parent)
    },
    wr = function(e) {
        return e._repeat ? $e(e._tTime, e = e.duration() + e._rDelay) * e : 0
    },
    $e = function(e, t) {
        var r = Math.floor(e = R(e / t));
        return e && r === e ? r - 1 : r
    },
    bt = function(e, t) {
        return (e - t._start) * t._ts + (t._ts >= 0 ? 0 : t._dirty ? t.totalDuration() : t._tDur)
    },
    Pt = function(e) {
        return e._end = R(e._start + (e._tDur / Math.abs(e._ts || e._rts || I) || 0))
    },
    Mt = function(e, t) {
        var r = e._dp;
        return r && r.smoothChildTiming && e._ts && (e._start = R(r._time - (e._ts > 0 ? t / e._ts : ((e._dirty ? e.totalDuration() : e._tDur) - t) / -e._ts)), Pt(e), r._dirty || Le(r, e)), e
    },
    Kr = function(e, t) {
        var r;
        if ((t._time || !t._dur && t._initted || t._start < e._time && (t._dur || !t.add)) && (r = bt(e.rawTime(), t), (!t._dur || ht(0, t.totalDuration(), r) - t._tTime > I) && t.render(r, !0)), Le(e, t)._dp && e._initted && e._time >= e._dur && e._ts) {
            if (e._dur < e.duration())
                for (r = e; r._dp;) r.rawTime() >= 0 && r.totalTime(r._tTime), r = r._dp;
            e._zTime = -I
        }
    },
    de = function(e, t, r, n) {
        return t.parent && Se(t), t._start = R((ve(r) ? r : r || e !== L ? oe(e, r, t) : e._time) + t._delay), t._end = R(t._start + (t.totalDuration() / Math.abs(t.timeScale()) || 0)), Zr(e, t, "_first", "_last", e._sort ? "_start" : 0), Xt(t) || (e._recent = t), n || Kr(e, t), e._ts < 0 && Mt(e, e._tTime), e
    },
    jr = function(e, t) {
        return (se.ScrollTrigger || nr("scrollTrigger", t)) && se.ScrollTrigger.create(t, e)
    },
    Jr = function(e, t, r, n, s) {
        if (fr(e, t, s), !e._initted) return 1;
        if (!r && e._pt && !q && (e._dur && e.vars.lazy !== !1 || !e._dur && e.vars.lazy) && qr !== te.frame) return be.push(e), e._lazy = [s, n], 1
    },
    jn = function c(e) {
        var t = e.parent;
        return t && t._ts && t._initted && !t._lock && (t.rawTime() < 0 || c(t))
    },
    Xt = function(e) {
        var t = e.data;
        return t === "isFromStart" || t === "isStart"
    },
    Jn = function(e, t, r, n) {
        var s = e.ratio,
            o = t < 0 || !t && (!e._start && jn(e) && !(!e._initted && Xt(e)) || (e._ts < 0 || e._dp._ts < 0) && !Xt(e)) ? 0 : 1,
            u = e._rDelay,
            _ = 0,
            l, h, i;
        if (u && e._repeat && (_ = ht(0, e._tDur, t), h = $e(_, u), e._yoyo && h & 1 && (o = 1 - o), h !== $e(e._tTime, u) && (s = 1 - o, e.vars.repeatRefresh && e._initted && e.invalidate())), o !== s || q || n || e._zTime === I || !t && e._zTime) {
            if (!e._initted && Jr(e, t, n, r, _)) return;
            for (i = e._zTime, e._zTime = t || (r ? I : 0), r || (r = t && !i), e.ratio = o, e._from && (o = 1 - o), e._time = 0, e._tTime = _, l = e._pt; l;) l.r(o, l.d), l = l._next;
            t < 0 && Nt(e, t, r, !0), e._onUpdate && !r && re(e, "onUpdate"), _ && e._repeat && !r && e.parent && re(e, "onRepeat"), (t >= e._tDur || t < 0) && e.ratio === o && (o && Se(e, 1), !r && !q && (re(e, o ? "onComplete" : "onReverseComplete", !0), e._prom && e._prom()))
        } else e._zTime || (e._zTime = t)
    },
    ei = function(e, t, r) {
        var n;
        if (r > t)
            for (n = e._first; n && n._start <= r;) {
                if (n.data === "isPause" && n._start > t) return n;
                n = n._next
            } else
                for (n = e._last; n && n._start >= r;) {
                    if (n.data === "isPause" && n._start < t) return n;
                    n = n._prev
                }
    },
    Qe = function(e, t, r, n) {
        var s = e._repeat,
            o = R(t) || 0,
            u = e._tTime / e._tDur;
        return u && !n && (e._time *= o / e._dur), e._dur = o, e._tDur = s ? s < 0 ? 1e10 : R(o * (s + 1) + e._rDelay * s) : o, u > 0 && !n && Mt(e, e._tTime = e._tDur * u), e.parent && Pt(e), r || Le(e.parent, e), e
    },
    br = function(e) {
        return e instanceof $ ? Le(e) : Qe(e, e._dur)
    },
    ti = {
        _start: 0,
        endTime: ut,
        totalDuration: ut
    },
    oe = function c(e, t, r) {
        var n = e.labels,
            s = e._recent || ti,
            o = e.duration() >= ue ? s.endTime(!1) : e._dur,
            u, _, l;
        return Y(t) && (isNaN(t) || t in n) ? (_ = t.charAt(0), l = t.substr(-1) === "%", u = t.indexOf("="), _ === "<" || _ === ">" ? (u >= 0 && (t = t.replace(/=/, "")), (_ === "<" ? s._start : s.endTime(s._repeat >= 0)) + (parseFloat(t.substr(1)) || 0) * (l ? (u < 0 ? s : r).totalDuration() / 100 : 1)) : u < 0 ? (t in n || (n[t] = o), n[t]) : (_ = parseFloat(t.charAt(u - 1) + t.substr(u + 1)), l && r && (_ = _ / 100 * (U(r) ? r[0] : r).totalDuration()), u > 1 ? c(e, t.substr(0, u - 1), r) + _ : o + _)) : t == null ? o : +t
    },
    st = function(e, t, r) {
        var n = ve(t[1]),
            s = (n ? 2 : 1) + (e < 2 ? 0 : 1),
            o = t[s],
            u, _;
        if (n && (o.duration = t[1]), o.parent = r, e) {
            for (u = o, _ = r; _ && !("immediateRender" in u);) u = _.vars.defaults || {}, _ = Q(_.vars.inherit) && _.parent;
            o.immediateRender = Q(u.immediateRender), e < 2 ? o.runBackwards = 1 : o.startAt = t[s - 1]
        }
        return new N(t[0], o, t[s + 1])
    },
    Pe = function(e, t) {
        return e || e === 0 ? t(e) : t
    },
    ht = function(e, t, r) {
        return r < e ? e : r > t ? t : r
    },
    W = function(e, t) {
        return !Y(e) || !(t = Yn.exec(e)) ? "" : t[1]
    },
    ri = function(e, t, r) {
        return Pe(r, function(n) {
            return ht(e, t, n)
        })
    },
    Yt = [].slice,
    en = function(e, t) {
        return e && he(e) && "length" in e && (!t && !e.length || e.length - 1 in e && he(e[0])) && !e.nodeType && e !== le
    },
    ni = function(e, t, r) {
        return r === void 0 && (r = []), e.forEach(function(n) {
            var s;
            return Y(n) && !t || en(n, 1) ? (s = r).push.apply(s, fe(n)) : r.push(n)
        }) || r
    },
    fe = function(e, t, r) {
        return F && !t && F.selector ? F.selector(e) : Y(e) && !r && (Ht || !Ze()) ? Yt.call((t || rr).querySelectorAll(e), 0) : U(e) ? ni(e, r) : en(e) ? Yt.call(e, 0) : e ? [e] : []
    },
    qt = function(e) {
        return e = fe(e)[0] || ot("Invalid scope") || {},
            function(t) {
                var r = e.current || e.nativeElement || e;
                return fe(t, r.querySelectorAll ? r : r === e ? ot("Invalid scope") || rr.createElement("div") : e)
            }
    },
    tn = function(e) {
        return e.sort(function() {
            return .5 - Math.random()
        })
    },
    rn = function(e) {
        if (V(e)) return e;
        var t = he(e) ? e : {
                each: e
            },
            r = Be(t.ease),
            n = t.from || 0,
            s = parseFloat(t.base) || 0,
            o = {},
            u = n > 0 && n < 1,
            _ = isNaN(n) || u,
            l = t.axis,
            h = n,
            i = n;
        return Y(n) ? h = i = {
                center: .5,
                edges: .5,
                end: 1
            }[n] || 0 : !u && _ && (h = n[0], i = n[1]),
            function(a, f, p) {
                var d = (p || t).length,
                    m = o[d],
                    g, v, y, w, x, b, A, S, T;
                if (!m) {
                    if (T = t.grid === "auto" ? 0 : (t.grid || [1, ue])[1], !T) {
                        for (A = -ue; A < (A = p[T++].getBoundingClientRect().left) && T < d;);
                        T < d && T--
                    }
                    for (m = o[d] = [], g = _ ? Math.min(T, d) * h - .5 : n % T, v = T === ue ? 0 : _ ? d * i / T - .5 : n / T | 0, A = 0, S = ue, b = 0; b < d; b++) y = b % T - g, w = v - (b / T | 0), m[b] = x = l ? Math.abs(l === "y" ? w : y) : Vr(y * y + w * w), x > A && (A = x), x < S && (S = x);
                    n === "random" && tn(m), m.max = A - S, m.min = S, m.v = d = (parseFloat(t.amount) || parseFloat(t.each) * (T > d ? d - 1 : l ? l === "y" ? d / T : T : Math.max(T, d / T)) || 0) * (n === "edges" ? -1 : 1), m.b = d < 0 ? s - d : s, m.u = W(t.amount || t.each) || 0, r = r && d < 0 ? cn(r) : r
                }
                return d = (m[a] - m.min) / m.max || 0, R(m.b + (r ? r(d) : d) * m.v) + m.u
            }
    },
    Wt = function(e) {
        var t = Math.pow(10, ((e + "").split(".")[1] || "").length);
        return function(r) {
            var n = R(Math.round(parseFloat(r) / e) * e * t);
            return (n - n % 1) / t + (ve(r) ? 0 : W(r))
        }
    },
    nn = function(e, t) {
        var r = U(e),
            n, s;
        return !r && he(e) && (n = r = e.radius || ue, e.values ? (e = fe(e.values), (s = !ve(e[0])) && (n *= n)) : e = Wt(e.increment)), Pe(t, r ? V(e) ? function(o) {
            return s = e(o), Math.abs(s - o) <= n ? s : o
        } : function(o) {
            for (var u = parseFloat(s ? o.x : o), _ = parseFloat(s ? o.y : 0), l = ue, h = 0, i = e.length, a, f; i--;) s ? (a = e[i].x - u, f = e[i].y - _, a = a * a + f * f) : a = Math.abs(e[i] - u), a < l && (l = a, h = i);
            return h = !n || l <= n ? e[h] : o, s || h === o || ve(o) ? h : h + W(o)
        } : Wt(e))
    },
    sn = function(e, t, r, n) {
        return Pe(U(e) ? !t : r === !0 ? !!(r = 0) : !n, function() {
            return U(e) ? e[~~(Math.random() * e.length)] : (r = r || 1e-5) && (n = r < 1 ? Math.pow(10, (r + "").length - 2) : 1) && Math.floor(Math.round((e - r / 2 + Math.random() * (t - e + r * .99)) / r) * r * n) / n
        })
    },
    ii = function() {
        for (var e = arguments.length, t = new Array(e), r = 0; r < e; r++) t[r] = arguments[r];
        return function(n) {
            return t.reduce(function(s, o) {
                return o(s)
            }, n)
        }
    },
    si = function(e, t) {
        return function(r) {
            return e(parseFloat(r)) + (t || W(r))
        }
    },
    ai = function(e, t, r) {
        return on(e, t, 0, 1, r)
    },
    an = function(e, t, r) {
        return Pe(r, function(n) {
            return e[~~t(n)]
        })
    },
    oi = function c(e, t, r) {
        var n = t - e;
        return U(e) ? an(e, c(0, e.length), t) : Pe(r, function(s) {
            return (n + (s - e) % n) % n + e
        })
    },
    ui = function c(e, t, r) {
        var n = t - e,
            s = n * 2;
        return U(e) ? an(e, c(0, e.length - 1), t) : Pe(r, function(o) {
            return o = (s + (o - e) % s) % s || 0, e + (o > n ? s - o : o)
        })
    },
    ft = function(e) {
        return e.replace(zn, function(t) {
            var r = t.indexOf("[") + 1,
                n = t.substring(r || 7, r ? t.indexOf("]") : t.length - 1).split(Nn);
            return sn(r ? n : +n[0], r ? 0 : +n[1], +n[2] || 1e-5)
        })
    },
    on = function(e, t, r, n, s) {
        var o = t - e,
            u = n - r;
        return Pe(s, function(_) {
            return r + ((_ - e) / o * u || 0)
        })
    },
    fi = function c(e, t, r, n) {
        var s = isNaN(e + t) ? 0 : function(f) {
            return (1 - f) * e + f * t
        };
        if (!s) {
            var o = Y(e),
                u = {},
                _, l, h, i, a;
            if (r === !0 && (n = 1) && (r = null), o) e = {
                p: e
            }, t = {
                p: t
            };
            else if (U(e) && !U(t)) {
                for (h = [], i = e.length, a = i - 2, l = 1; l < i; l++) h.push(c(e[l - 1], e[l]));
                i--, s = function(p) {
                    p *= i;
                    var d = Math.min(a, ~~p);
                    return h[d](p - d)
                }, r = t
            } else n || (e = Ue(U(e) ? [] : {}, e));
            if (!h) {
                for (_ in t) ur.call(u, e, _, "get", t[_]);
                s = function(p) {
                    return dr(p, u) || (o ? e.p : e)
                }
            }
        }
        return Pe(r, s)
    },
    Ar = function(e, t, r) {
        var n = e.labels,
            s = ue,
            o, u, _;
        for (o in n) u = n[o] - t, u < 0 == !!r && u && s > (u = Math.abs(u)) && (_ = o, s = u);
        return _
    },
    re = function(e, t, r) {
        var n = e.vars,
            s = n[t],
            o = F,
            u = e._ctx,
            _, l, h;
        if (s) return _ = n[t + "Params"], l = n.callbackScope || e, r && be.length && xt(), u && (F = u), h = _ ? s.apply(l, _) : s.call(l), F = o, h
    },
    rt = function(e) {
        return Se(e), e.scrollTrigger && e.scrollTrigger.kill(!!q), e.progress() < 1 && re(e, "onInterrupt"), e
    },
    Ne, un = [],
    fn = function(e) {
        if (e)
            if (e = !e.name && e.default || e, tr() || e.headless) {
                var t = e.name,
                    r = V(e),
                    n = t && !r && e.init ? function() {
                        this._props = []
                    } : e,
                    s = {
                        init: ut,
                        render: dr,
                        add: ur,
                        kill: Si,
                        modifier: Ai,
                        rawVars: 0
                    },
                    o = {
                        targetTest: 0,
                        get: 0,
                        getSetter: lr,
                        aliases: {},
                        register: 0
                    };
                if (Ze(), e !== n) {
                    if (ee[t]) return;
                    ae(n, ae(wt(e, s), o)), Ue(n.prototype, Ue(s, wt(e, o))), ee[n.prop = t] = n, e.targetTest && (vt.push(n), ir[t] = 1), t = (t === "css" ? "CSS" : t.charAt(0).toUpperCase() + t.substr(1)) + "Plugin"
                }
                Yr(t, n), e.register && e.register(J, n, K)
            } else un.push(e)
    },
    D = 255,
    nt = {
        aqua: [0, D, D],
        lime: [0, D, 0],
        silver: [192, 192, 192],
        black: [0, 0, 0],
        maroon: [128, 0, 0],
        teal: [0, 128, 128],
        blue: [0, 0, D],
        navy: [0, 0, 128],
        white: [D, D, D],
        olive: [128, 128, 0],
        yellow: [D, D, 0],
        orange: [D, 165, 0],
        gray: [128, 128, 128],
        purple: [128, 0, 128],
        green: [0, 128, 0],
        red: [D, 0, 0],
        pink: [D, 192, 203],
        cyan: [0, D, D],
        transparent: [D, D, D, 0]
    },
    Et = function(e, t, r) {
        return e += e < 0 ? 1 : e > 1 ? -1 : 0, (e * 6 < 1 ? t + (r - t) * e * 6 : e < .5 ? r : e * 3 < 2 ? t + (r - t) * (2 / 3 - e) * 6 : t) * D + .5 | 0
    },
    _n = function(e, t, r) {
        var n = e ? ve(e) ? [e >> 16, e >> 8 & D, e & D] : 0 : nt.black,
            s, o, u, _, l, h, i, a, f, p;
        if (!n) {
            if (e.substr(-1) === "," && (e = e.substr(0, e.length - 1)), nt[e]) n = nt[e];
            else if (e.charAt(0) === "#") {
                if (e.length < 6 && (s = e.charAt(1), o = e.charAt(2), u = e.charAt(3), e = "#" + s + s + o + o + u + u + (e.length === 5 ? e.charAt(4) + e.charAt(4) : "")), e.length === 9) return n = parseInt(e.substr(1, 6), 16), [n >> 16, n >> 8 & D, n & D, parseInt(e.substr(7), 16) / 255];
                e = parseInt(e.substr(1), 16), n = [e >> 16, e >> 8 & D, e & D]
            } else if (e.substr(0, 3) === "hsl") {
                if (n = p = e.match(yr), !t) _ = +n[0] % 360 / 360, l = +n[1] / 100, h = +n[2] / 100, o = h <= .5 ? h * (l + 1) : h + l - h * l, s = h * 2 - o, n.length > 3 && (n[3] *= 1), n[0] = Et(_ + 1 / 3, s, o), n[1] = Et(_, s, o), n[2] = Et(_ - 1 / 3, s, o);
                else if (~e.indexOf("=")) return n = e.match(Hr), r && n.length < 4 && (n[3] = 1), n
            } else n = e.match(yr) || nt.transparent;
            n = n.map(Number)
        }
        return t && !p && (s = n[0] / D, o = n[1] / D, u = n[2] / D, i = Math.max(s, o, u), a = Math.min(s, o, u), h = (i + a) / 2, i === a ? _ = l = 0 : (f = i - a, l = h > .5 ? f / (2 - i - a) : f / (i + a), _ = i === s ? (o - u) / f + (o < u ? 6 : 0) : i === o ? (u - s) / f + 2 : (s - o) / f + 4, _ *= 60), n[0] = ~~(_ + .5), n[1] = ~~(l * 100 + .5), n[2] = ~~(h * 100 + .5)), r && n.length < 4 && (n[3] = 1), n
    },
    ln = function(e) {
        var t = [],
            r = [],
            n = -1;
        return e.split(Ae).forEach(function(s) {
            var o = s.match(ze) || [];
            t.push.apply(t, o), r.push(n += o.length + 1)
        }), t.c = r, t
    },
    Sr = function(e, t, r) {
        var n = "",
            s = (e + n).match(Ae),
            o = t ? "hsla(" : "rgba(",
            u = 0,
            _, l, h, i;
        if (!s) return e;
        if (s = s.map(function(a) {
                return (a = _n(a, t, 1)) && o + (t ? a[0] + "," + a[1] + "%," + a[2] + "%," + a[3] : a.join(",")) + ")"
            }), r && (h = ln(e), _ = r.c, _.join(n) !== h.c.join(n)))
            for (l = e.replace(Ae, "1").split(ze), i = l.length - 1; u < i; u++) n += l[u] + (~_.indexOf(u) ? s.shift() || o + "0,0,0,0)" : (h.length ? h : s.length ? s : r).shift());
        if (!l)
            for (l = e.split(Ae), i = l.length - 1; u < i; u++) n += l[u] + s[u];
        return n + l[i]
    },
    Ae = (function() {
        var c = "(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#(?:[0-9a-f]{3,4}){1,2}\\b",
            e;
        for (e in nt) c += "|" + e + "\\b";
        return new RegExp(c + ")", "gi")
    })(),
    _i = /hsl[a]?\(/,
    dn = function(e) {
        var t = e.join(" "),
            r;
        if (Ae.lastIndex = 0, Ae.test(t)) return r = _i.test(t), e[1] = Sr(e[1], r), e[0] = Sr(e[0], r, ln(e[1])), !0
    },
    _t, te = (function() {
        var c = Date.now,
            e = 500,
            t = 33,
            r = c(),
            n = r,
            s = 1e3 / 240,
            o = s,
            u = [],
            _, l, h, i, a, f, p = function d(m) {
                var g = c() - n,
                    v = m === !0,
                    y, w, x, b;
                if ((g > e || g < 0) && (r += g - t), n += g, x = n - r, y = x - o, (y > 0 || v) && (b = ++i.frame, a = x - i.time * 1e3, i.time = x = x / 1e3, o += y + (y >= s ? 4 : s - y), w = 1), v || (_ = l(d)), w)
                    for (f = 0; f < u.length; f++) u[f](x, a, b, m)
            };
        return i = {
            time: 0,
            frame: 0,
            tick: function() {
                p(!0)
            },
            deltaRatio: function(m) {
                return a / (1e3 / (m || 60))
            },
            wake: function() {
                Nr && (!Ht && tr() && (le = Ht = window, rr = le.document || {}, se.gsap = J, (le.gsapVersions || (le.gsapVersions = [])).push(J.version), Xr(Tt || le.GreenSockGlobals || !le.gsap && le || {}), un.forEach(fn)), h = typeof requestAnimationFrame < "u" && requestAnimationFrame, _ && i.sleep(), l = h || function(m) {
                    return setTimeout(m, o - i.time * 1e3 + 1 | 0)
                }, _t = 1, p(2))
            },
            sleep: function() {
                (h ? cancelAnimationFrame : clearTimeout)(_), _t = 0, l = ut
            },
            lagSmoothing: function(m, g) {
                e = m || 1 / 0, t = Math.min(g || 33, e)
            },
            fps: function(m) {
                s = 1e3 / (m || 240), o = i.time * 1e3 + s
            },
            add: function(m, g, v) {
                var y = g ? function(w, x, b, A) {
                    m(w, x, b, A), i.remove(y)
                } : m;
                return i.remove(m), u[v ? "unshift" : "push"](y), Ze(), y
            },
            remove: function(m, g) {
                ~(g = u.indexOf(m)) && u.splice(g, 1) && f >= g && f--
            },
            _listeners: u
        }, i
    })(),
    Ze = function() {
        return !_t && te.wake()
    },
    O = {},
    li = /^[\d.\-M][\d.\-,\s]/,
    di = /["']/g,
    ci = function(e) {
        for (var t = {}, r = e.substr(1, e.length - 3).split(":"), n = r[0], s = 1, o = r.length, u, _, l; s < o; s++) _ = r[s], u = s !== o - 1 ? _.lastIndexOf(",") : _.length, l = _.substr(0, u), t[n] = isNaN(l) ? l.replace(di, "").trim() : +l, n = _.substr(u + 1).trim();
        return t
    },
    hi = function(e) {
        var t = e.indexOf("(") + 1,
            r = e.indexOf(")"),
            n = e.indexOf("(", t);
        return e.substring(t, ~n && n < r ? e.indexOf(")", r + 1) : r)
    },
    pi = function(e) {
        var t = (e + "").split("("),
            r = O[t[0]];
        return r && t.length > 1 && r.config ? r.config.apply(null, ~e.indexOf("{") ? [ci(t[1])] : hi(e).split(",").map($r)) : O._CE && li.test(e) ? O._CE("", e) : r
    },
    cn = function(e) {
        return function(t) {
            return 1 - e(1 - t)
        }
    },
    hn = function c(e, t) {
        for (var r = e._first, n; r;) r instanceof $ ? c(r, t) : r.vars.yoyoEase && (!r._yoyo || !r._repeat) && r._yoyo !== t && (r.timeline ? c(r.timeline, t) : (n = r._ease, r._ease = r._yEase, r._yEase = n, r._yoyo = t)), r = r._next
    },
    Be = function(e, t) {
        return e && (V(e) ? e : O[e] || pi(e)) || t
    },
    Ge = function(e, t, r, n) {
        r === void 0 && (r = function(_) {
            return 1 - t(1 - _)
        }), n === void 0 && (n = function(_) {
            return _ < .5 ? t(_ * 2) / 2 : 1 - t((1 - _) * 2) / 2
        });
        var s = {
                easeIn: t,
                easeOut: r,
                easeInOut: n
            },
            o;
        return Z(e, function(u) {
            O[u] = se[u] = s, O[o = u.toLowerCase()] = r;
            for (var _ in s) O[o + (_ === "easeIn" ? ".in" : _ === "easeOut" ? ".out" : ".inOut")] = O[u + "." + _] = s[_]
        }), s
    },
    pn = function(e) {
        return function(t) {
            return t < .5 ? (1 - e(1 - t * 2)) / 2 : .5 + e((t - .5) * 2) / 2
        }
    },
    Ft = function c(e, t, r) {
        var n = t >= 1 ? t : 1,
            s = (r || (e ?.3 : .45)) / (t < 1 ? t : 1),
            o = s / Gt * (Math.asin(1 / n) || 0),
            u = function(h) {
                return h === 1 ? 1 : n * Math.pow(2, -10 * h) * Hn((h - o) * s) + 1
            },
            _ = e === "out" ? u : e === "in" ? function(l) {
                return 1 - u(1 - l)
            } : pn(u);
        return s = Gt / s, _.config = function(l, h) {
            return c(e, l, h)
        }, _
    },
    Rt = function c(e, t) {
        t === void 0 && (t = 1.70158);
        var r = function(o) {
                return o ? --o * o * ((t + 1) * o + t) + 1 : 0
            },
            n = e === "out" ? r : e === "in" ? function(s) {
                return 1 - r(1 - s)
            } : pn(r);
        return n.config = function(s) {
            return c(e, s)
        }, n
    };
Z("Linear,Quad,Cubic,Quart,Quint,Strong", function(c, e) {
    var t = e < 5 ? e + 1 : e;
    Ge(c + ",Power" + (t - 1), e ? function(r) {
        return Math.pow(r, t)
    } : function(r) {
        return r
    }, function(r) {
        return 1 - Math.pow(1 - r, t)
    }, function(r) {
        return r < .5 ? Math.pow(r * 2, t) / 2 : 1 - Math.pow((1 - r) * 2, t) / 2
    })
});
O.Linear.easeNone = O.none = O.Linear.easeIn;
Ge("Elastic", Ft("in"), Ft("out"), Ft());
(function(c, e) {
    var t = 1 / e,
        r = 2 * t,
        n = 2.5 * t,
        s = function(u) {
            return u < t ? c * u * u : u < r ? c * Math.pow(u - 1.5 / e, 2) + .75 : u < n ? c * (u -= 2.25 / e) * u + .9375 : c * Math.pow(u - 2.625 / e, 2) + .984375
        };
    Ge("Bounce", function(o) {
        return 1 - s(1 - o)
    }, s)
})(7.5625, 2.75);
Ge("Expo", function(c) {
    return Math.pow(2, 10 * (c - 1)) * c + c * c * c * c * c * c * (1 - c)
});
Ge("Circ", function(c) {
    return -(Vr(1 - c * c) - 1)
});
Ge("Sine", function(c) {
    return c === 1 ? 1 : -Gn(c * Bn) + 1
});
Ge("Back", Rt("in"), Rt("out"), Rt());
O.SteppedEase = O.steps = se.SteppedEase = {
    config: function(e, t) {
        e === void 0 && (e = 1);
        var r = 1 / e,
            n = e + (t ? 0 : 1),
            s = t ? 1 : 0,
            o = 1 - I;
        return function(u) {
            return ((n * ht(0, o, u) | 0) + s) * r
        }
    }
};
We.ease = O["quad.out"];
Z("onComplete,onUpdate,onStart,onRepeat,onReverseComplete,onInterrupt", function(c) {
    return sr += c + "," + c + "Params,"
});
var mn = function(e, t) {
        this.id = Vn++, e._gsap = this, this.target = e, this.harness = t, this.get = t ? t.get : Wr, this.set = t ? t.getSetter : lr
    },
    lt = (function() {
        function c(t) {
            this.vars = t, this._delay = +t.delay || 0, (this._repeat = t.repeat === 1 / 0 ? -2 : t.repeat || 0) && (this._rDelay = t.repeatDelay || 0, this._yoyo = !!t.yoyo || !!t.yoyoEase), this._ts = 1, Qe(this, +t.duration, 1, 1), this.data = t.data, F && (this._ctx = F, F.data.push(this)), _t || te.wake()
        }
        var e = c.prototype;
        return e.delay = function(r) {
            return r || r === 0 ? (this.parent && this.parent.smoothChildTiming && this.startTime(this._start + r - this._delay), this._delay = r, this) : this._delay
        }, e.duration = function(r) {
            return arguments.length ? this.totalDuration(this._repeat > 0 ? r + (r + this._rDelay) * this._repeat : r) : this.totalDuration() && this._dur
        }, e.totalDuration = function(r) {
            return arguments.length ? (this._dirty = 0, Qe(this, this._repeat < 0 ? r : (r - this._repeat * this._rDelay) / (this._repeat + 1))) : this._tDur
        }, e.totalTime = function(r, n) {
            if (Ze(), !arguments.length) return this._tTime;
            var s = this._dp;
            if (s && s.smoothChildTiming && this._ts) {
                for (Mt(this, r), !s._dp || s.parent || Kr(s, this); s && s.parent;) s.parent._time !== s._start + (s._ts >= 0 ? s._tTime / s._ts : (s.totalDuration() - s._tTime) / -s._ts) && s.totalTime(s._tTime, !0), s = s.parent;
                !this.parent && this._dp.autoRemoveChildren && (this._ts > 0 && r < this._tDur || this._ts < 0 && r > 0 || !this._tDur && !r) && de(this._dp, this, this._start - this._delay)
            }
            return (this._tTime !== r || !this._dur && !n || this._initted && Math.abs(this._zTime) === I || !this._initted && this._dur && r || !r && !this._initted && (this.add || this._ptLookup)) && (this._ts || (this._pTime = r), Ur(this, r, n)), this
        }, e.time = function(r, n) {
            return arguments.length ? this.totalTime(Math.min(this.totalDuration(), r + wr(this)) % (this._dur + this._rDelay) || (r ? this._dur : 0), n) : this._time
        }, e.totalProgress = function(r, n) {
            return arguments.length ? this.totalTime(this.totalDuration() * r, n) : this.totalDuration() ? Math.min(1, this._tTime / this._tDur) : this.rawTime() >= 0 && this._initted ? 1 : 0
        }, e.progress = function(r, n) {
            return arguments.length ? this.totalTime(this.duration() * (this._yoyo && !(this.iteration() & 1) ? 1 - r : r) + wr(this), n) : this.duration() ? Math.min(1, this._time / this._dur) : this.rawTime() > 0 ? 1 : 0
        }, e.iteration = function(r, n) {
            var s = this.duration() + this._rDelay;
            return arguments.length ? this.totalTime(this._time + (r - 1) * s, n) : this._repeat ? $e(this._tTime, s) + 1 : 1
        }, e.timeScale = function(r, n) {
            if (!arguments.length) return this._rts === -I ? 0 : this._rts;
            if (this._rts === r) return this;
            var s = this.parent && this._ts ? bt(this.parent._time, this) : this._tTime;
            return this._rts = +r || 0, this._ts = this._ps || r === -I ? 0 : this._rts, this.totalTime(ht(-Math.abs(this._delay), this.totalDuration(), s), n !== !1), Pt(this), Zn(this)
        }, e.paused = function(r) {
            return arguments.length ? (this._ps !== r && (this._ps = r, r ? (this._pTime = this._tTime || Math.max(-this._delay, this.rawTime()), this._ts = this._act = 0) : (Ze(), this._ts = this._rts, this.totalTime(this.parent && !this.parent.smoothChildTiming ? this.rawTime() : this._tTime || this._pTime, this.progress() === 1 && Math.abs(this._zTime) !== I && (this._tTime -= I)))), this) : this._ps
        }, e.startTime = function(r) {
            if (arguments.length) {
                this._start = R(r);
                var n = this.parent || this._dp;
                return n && (n._sort || !this.parent) && de(n, this, this._start - this._delay), this
            }
            return this._start
        }, e.endTime = function(r) {
            return this._start + (Q(r) ? this.totalDuration() : this.duration()) / Math.abs(this._ts || 1)
        }, e.rawTime = function(r) {
            var n = this.parent || this._dp;
            return n ? r && (!this._ts || this._repeat && this._time && this.totalProgress() < 1) ? this._tTime % (this._dur + this._rDelay) : this._ts ? bt(n.rawTime(r), this) : this._tTime : this._tTime
        }, e.revert = function(r) {
            r === void 0 && (r = Wn);
            var n = q;
            return q = r, or(this) && (this.timeline && this.timeline.revert(r), this.totalTime(-.01, r.suppressEvents)), this.data !== "nested" && r.kill !== !1 && this.kill(), q = n, this
        }, e.globalTime = function(r) {
            for (var n = this, s = arguments.length ? r : n.rawTime(); n;) s = n._start + s / (Math.abs(n._ts) || 1), n = n._dp;
            return !this.parent && this._sat ? this._sat.globalTime(r) : s
        }, e.repeat = function(r) {
            return arguments.length ? (this._repeat = r === 1 / 0 ? -2 : r, br(this)) : this._repeat === -2 ? 1 / 0 : this._repeat
        }, e.repeatDelay = function(r) {
            if (arguments.length) {
                var n = this._time;
                return this._rDelay = r, br(this), n ? this.time(n) : this
            }
            return this._rDelay
        }, e.yoyo = function(r) {
            return arguments.length ? (this._yoyo = r, this) : this._yoyo
        }, e.seek = function(r, n) {
            return this.totalTime(oe(this, r), Q(n))
        }, e.restart = function(r, n) {
            return this.play().totalTime(r ? -this._delay : 0, Q(n)), this._dur || (this._zTime = -I), this
        }, e.play = function(r, n) {
            return r != null && this.seek(r, n), this.reversed(!1).paused(!1)
        }, e.reverse = function(r, n) {
            return r != null && this.seek(r || this.totalDuration(), n), this.reversed(!0).paused(!1)
        }, e.pause = function(r, n) {
            return r != null && this.seek(r, n), this.paused(!0)
        }, e.resume = function() {
            return this.paused(!1)
        }, e.reversed = function(r) {
            return arguments.length ? (!!r !== this.reversed() && this.timeScale(-this._rts || (r ? -I : 0)), this) : this._rts < 0
        }, e.invalidate = function() {
            return this._initted = this._act = 0, this._zTime = -I, this
        }, e.isActive = function() {
            var r = this.parent || this._dp,
                n = this._start,
                s;
            return !!(!r || this._ts && this._initted && r.isActive() && (s = r.rawTime(!0)) >= n && s < this.endTime(!0) - I)
        }, e.eventCallback = function(r, n, s) {
            var o = this.vars;
            return arguments.length > 1 ? (n ? (o[r] = n, s && (o[r + "Params"] = s), r === "onUpdate" && (this._onUpdate = n)) : delete o[r], this) : o[r]
        }, e.then = function(r) {
            var n = this,
                s = n._prom;
            return new Promise(function(o) {
                var u = V(r) ? r : Qr,
                    _ = function() {
                        var h = n.then;
                        n.then = null, s && s(), V(u) && (u = u(n)) && (u.then || u === n) && (n.then = h), o(u), n.then = h
                    };
                n._initted && n.totalProgress() === 1 && n._ts >= 0 || !n._tTime && n._ts < 0 ? _() : n._prom = _
            })
        }, e.kill = function() {
            rt(this)
        }, c
    })();
ae(lt.prototype, {
    _time: 0,
    _start: 0,
    _end: 0,
    _tTime: 0,
    _tDur: 0,
    _dirty: 0,
    _repeat: 0,
    _yoyo: !1,
    parent: null,
    _initted: !1,
    _rDelay: 0,
    _ts: 1,
    _dp: 0,
    ratio: 0,
    _zTime: -I,
    _prom: 0,
    _ps: !1,
    _rts: 1
});
var $ = (function(c) {
    Br(e, c);

    function e(r, n) {
        var s;
        return r === void 0 && (r = {}), s = c.call(this, r) || this, s.labels = {}, s.smoothChildTiming = !!r.smoothChildTiming, s.autoRemoveChildren = !!r.autoRemoveChildren, s._sort = Q(r.sortChildren), L && de(r.parent || L, me(s), n), r.reversed && s.reverse(), r.paused && s.paused(!0), r.scrollTrigger && jr(me(s), r.scrollTrigger), s
    }
    var t = e.prototype;
    return t.to = function(n, s, o) {
        return st(0, arguments, this), this
    }, t.from = function(n, s, o) {
        return st(1, arguments, this), this
    }, t.fromTo = function(n, s, o, u) {
        return st(2, arguments, this), this
    }, t.set = function(n, s, o) {
        return s.duration = 0, s.parent = this, it(s).repeatDelay || (s.repeat = 0), s.immediateRender = !!s.immediateRender, new N(n, s, oe(this, o), 1), this
    }, t.call = function(n, s, o) {
        return de(this, N.delayedCall(0, n, s), o)
    }, t.staggerTo = function(n, s, o, u, _, l, h) {
        return o.duration = s, o.stagger = o.stagger || u, o.onComplete = l, o.onCompleteParams = h, o.parent = this, new N(n, o, oe(this, _)), this
    }, t.staggerFrom = function(n, s, o, u, _, l, h) {
        return o.runBackwards = 1, it(o).immediateRender = Q(o.immediateRender), this.staggerTo(n, s, o, u, _, l, h)
    }, t.staggerFromTo = function(n, s, o, u, _, l, h, i) {
        return u.startAt = o, it(u).immediateRender = Q(u.immediateRender), this.staggerTo(n, s, u, _, l, h, i)
    }, t.render = function(n, s, o) {
        var u = this._time,
            _ = this._dirty ? this.totalDuration() : this._tDur,
            l = this._dur,
            h = n <= 0 ? 0 : R(n),
            i = this._zTime < 0 != n < 0 && (this._initted || !l),
            a, f, p, d, m, g, v, y, w, x, b, A;
        if (this !== L && h > _ && n >= 0 && (h = _), h !== this._tTime || o || i) {
            if (u !== this._time && l && (h += this._time - u, n += this._time - u), a = h, w = this._start, y = this._ts, g = !y, i && (l || (u = this._zTime), (n || !s) && (this._zTime = n)), this._repeat) {
                if (b = this._yoyo, m = l + this._rDelay, this._repeat < -1 && n < 0) return this.totalTime(m * 100 + n, s, o);
                if (a = R(h % m), h === _ ? (d = this._repeat, a = l) : (x = R(h / m), d = ~~x, d && d === x && (a = l, d--), a > l && (a = l)), x = $e(this._tTime, m), !u && this._tTime && x !== d && this._tTime - x * m - this._dur <= 0 && (x = d), b && d & 1 && (a = l - a, A = 1), d !== x && !this._lock) {
                    var S = b && x & 1,
                        T = S === (b && d & 1);
                    if (d < x && (S = !S), u = S ? 0 : h % l ? l : h, this._lock = 1, this.render(u || (A ? 0 : R(d * m)), s, !l)._lock = 0, this._tTime = h, !s && this.parent && re(this, "onRepeat"), this.vars.repeatRefresh && !A && (this.invalidate()._lock = 1, x = d), u && u !== this._time || g !== !this._ts || this.vars.onRepeat && !this.parent && !this._act) return this;
                    if (l = this._dur, _ = this._tDur, T && (this._lock = 2, u = S ? l : -1e-4, this.render(u, !0), this.vars.repeatRefresh && !A && this.invalidate()), this._lock = 0, !this._ts && !g) return this;
                    hn(this, A)
                }
            }
            if (this._hasPause && !this._forcing && this._lock < 2 && (v = ei(this, R(u), R(a)), v && (h -= a - (a = v._start))), this._tTime = h, this._time = a, this._act = !y, this._initted || (this._onUpdate = this.vars.onUpdate, this._initted = 1, this._zTime = n, u = 0), !u && h && l && !s && !x && (re(this, "onStart"), this._tTime !== h)) return this;
            if (a >= u && n >= 0)
                for (f = this._first; f;) {
                    if (p = f._next, (f._act || a >= f._start) && f._ts && v !== f) {
                        if (f.parent !== this) return this.render(n, s, o);
                        if (f.render(f._ts > 0 ? (a - f._start) * f._ts : (f._dirty ? f.totalDuration() : f._tDur) + (a - f._start) * f._ts, s, o), a !== this._time || !this._ts && !g) {
                            v = 0, p && (h += this._zTime = -I);
                            break
                        }
                    }
                    f = p
                } else {
                    f = this._last;
                    for (var k = n < 0 ? n : a; f;) {
                        if (p = f._prev, (f._act || k <= f._end) && f._ts && v !== f) {
                            if (f.parent !== this) return this.render(n, s, o);
                            if (f.render(f._ts > 0 ? (k - f._start) * f._ts : (f._dirty ? f.totalDuration() : f._tDur) + (k - f._start) * f._ts, s, o || q && or(f)), a !== this._time || !this._ts && !g) {
                                v = 0, p && (h += this._zTime = k ? -I : I);
                                break
                            }
                        }
                        f = p
                    }
                }
            if (v && !s && (this.pause(), v.render(a >= u ? 0 : -I)._zTime = a >= u ? 1 : -1, this._ts)) return this._start = w, Pt(this), this.render(n, s, o);
            this._onUpdate && !s && re(this, "onUpdate", !0), (h === _ && this._tTime >= this.totalDuration() || !h && u) && (w === this._start || Math.abs(y) !== Math.abs(this._ts)) && (this._lock || ((n || !l) && (h === _ && this._ts > 0 || !h && this._ts < 0) && Se(this, 1), !s && !(n < 0 && !u) && (h || u || !_) && (re(this, h === _ && n >= 0 ? "onComplete" : "onReverseComplete", !0), this._prom && !(h < _ && this.timeScale() > 0) && this._prom())))
        }
        return this
    }, t.add = function(n, s) {
        var o = this;
        if (ve(s) || (s = oe(this, s, n)), !(n instanceof lt)) {
            if (U(n)) return n.forEach(function(u) {
                return o.add(u, s)
            }), this;
            if (Y(n)) return this.addLabel(n, s);
            if (V(n)) n = N.delayedCall(0, n);
            else return this
        }
        return this !== n ? de(this, n, s) : this
    }, t.getChildren = function(n, s, o, u) {
        n === void 0 && (n = !0), s === void 0 && (s = !0), o === void 0 && (o = !0), u === void 0 && (u = -ue);
        for (var _ = [], l = this._first; l;) l._start >= u && (l instanceof N ? s && _.push(l) : (o && _.push(l), n && _.push.apply(_, l.getChildren(!0, s, o)))), l = l._next;
        return _
    }, t.getById = function(n) {
        for (var s = this.getChildren(1, 1, 1), o = s.length; o--;)
            if (s[o].vars.id === n) return s[o]
    }, t.remove = function(n) {
        return Y(n) ? this.removeLabel(n) : V(n) ? this.killTweensOf(n) : (n.parent === this && Ot(this, n), n === this._recent && (this._recent = this._last), Le(this))
    }, t.totalTime = function(n, s) {
        return arguments.length ? (this._forcing = 1, !this._dp && this._ts && (this._start = R(te.time - (this._ts > 0 ? n / this._ts : (this.totalDuration() - n) / -this._ts))), c.prototype.totalTime.call(this, n, s), this._forcing = 0, this) : this._tTime
    }, t.addLabel = function(n, s) {
        return this.labels[n] = oe(this, s), this
    }, t.removeLabel = function(n) {
        return delete this.labels[n], this
    }, t.addPause = function(n, s, o) {
        var u = N.delayedCall(0, s || ut, o);
        return u.data = "isPause", this._hasPause = 1, de(this, u, oe(this, n))
    }, t.removePause = function(n) {
        var s = this._first;
        for (n = oe(this, n); s;) s._start === n && s.data === "isPause" && Se(s), s = s._next
    }, t.killTweensOf = function(n, s, o) {
        for (var u = this.getTweensOf(n, o), _ = u.length; _--;) Te !== u[_] && u[_].kill(n, s);
        return this
    }, t.getTweensOf = function(n, s) {
        for (var o = [], u = fe(n), _ = this._first, l = ve(s), h; _;) _ instanceof N ? Un(_._targets, u) && (l ? (!Te || _._initted && _._ts) && _.globalTime(0) <= s && _.globalTime(_.totalDuration()) > s : !s || _.isActive()) && o.push(_) : (h = _.getTweensOf(u, s)).length && o.push.apply(o, h), _ = _._next;
        return o
    }, t.tweenTo = function(n, s) {
        s = s || {};
        var o = this,
            u = oe(o, n),
            _ = s,
            l = _.startAt,
            h = _.onStart,
            i = _.onStartParams,
            a = _.immediateRender,
            f, p = N.to(o, ae({
                ease: s.ease || "none",
                lazy: !1,
                immediateRender: !1,
                time: u,
                overwrite: "auto",
                duration: s.duration || Math.abs((u - (l && "time" in l ? l.time : o._time)) / o.timeScale()) || I,
                onStart: function() {
                    if (o.pause(), !f) {
                        var m = s.duration || Math.abs((u - (l && "time" in l ? l.time : o._time)) / o.timeScale());
                        p._dur !== m && Qe(p, m, 0, 1).render(p._time, !0, !0), f = 1
                    }
                    h && h.apply(p, i || [])
                }
            }, s));
        return a ? p.render(0) : p
    }, t.tweenFromTo = function(n, s, o) {
        return this.tweenTo(s, ae({
            startAt: {
                time: oe(this, n)
            }
        }, o))
    }, t.recent = function() {
        return this._recent
    }, t.nextLabel = function(n) {
        return n === void 0 && (n = this._time), Ar(this, oe(this, n))
    }, t.previousLabel = function(n) {
        return n === void 0 && (n = this._time), Ar(this, oe(this, n), 1)
    }, t.currentLabel = function(n) {
        return arguments.length ? this.seek(n, !0) : this.previousLabel(this._time + I)
    }, t.shiftChildren = function(n, s, o) {
        o === void 0 && (o = 0);
        var u = this._first,
            _ = this.labels,
            l;
        for (n = R(n); u;) u._start >= o && (u._start += n, u._end += n), u = u._next;
        if (s)
            for (l in _) _[l] >= o && (_[l] += n);
        return Le(this)
    }, t.invalidate = function(n) {
        var s = this._first;
        for (this._lock = 0; s;) s.invalidate(n), s = s._next;
        return c.prototype.invalidate.call(this, n)
    }, t.clear = function(n) {
        n === void 0 && (n = !0);
        for (var s = this._first, o; s;) o = s._next, this.remove(s), s = o;
        return this._dp && (this._time = this._tTime = this._pTime = 0), n && (this.labels = {}), Le(this)
    }, t.totalDuration = function(n) {
        var s = 0,
            o = this,
            u = o._last,
            _ = ue,
            l, h, i;
        if (arguments.length) return o.timeScale((o._repeat < 0 ? o.duration() : o.totalDuration()) / (o.reversed() ? -n : n));
        if (o._dirty) {
            for (i = o.parent; u;) l = u._prev, u._dirty && u.totalDuration(), h = u._start, h > _ && o._sort && u._ts && !o._lock ? (o._lock = 1, de(o, u, h - u._delay, 1)._lock = 0) : _ = h, h < 0 && u._ts && (s -= h, (!i && !o._dp || i && i.smoothChildTiming) && (o._start += R(h / o._ts), o._time -= h, o._tTime -= h), o.shiftChildren(-h, !1, -1 / 0), _ = 0), u._end > s && u._ts && (s = u._end), u = l;
            Qe(o, o === L && o._time > s ? o._time : s, 1, 1), o._dirty = 0
        }
        return o._tDur
    }, e.updateRoot = function(n) {
        if (L._ts && (Ur(L, bt(n, L)), qr = te.frame), te.frame >= Tr) {
            Tr += ie.autoSleep || 120;
            var s = L._first;
            if ((!s || !s._ts) && ie.autoSleep && te._listeners.length < 2) {
                for (; s && !s._ts;) s = s._next;
                s || te.sleep()
            }
        }
    }, e
})(lt);
ae($.prototype, {
    _lock: 0,
    _hasPause: 0,
    _forcing: 0
});
var mi = function(e, t, r, n, s, o, u) {
        var _ = new K(this._pt, e, t, 0, 1, wn, null, s),
            l = 0,
            h = 0,
            i, a, f, p, d, m, g, v;
        for (_.b = r, _.e = n, r += "", n += "", (g = ~n.indexOf("random(")) && (n = ft(n)), o && (v = [r, n], o(v, e, t), r = v[0], n = v[1]), a = r.match(Dt) || []; i = Dt.exec(n);) p = i[0], d = n.substring(l, i.index), f ? f = (f + 1) % 5 : d.substr(-5) === "rgba(" && (f = 1), p !== a[h++] && (m = parseFloat(a[h - 1]) || 0, _._pt = {
            _next: _._pt,
            p: d || h === 1 ? d : ",",
            s: m,
            c: p.charAt(1) === "=" ? Xe(m, p) - m : parseFloat(p) - m,
            m: f && f < 4 ? Math.round : 0
        }, l = Dt.lastIndex);
        return _.c = l < n.length ? n.substring(l, n.length) : "", _.fp = u, (zr.test(n) || g) && (_.e = 0), this._pt = _, _
    },
    ur = function(e, t, r, n, s, o, u, _, l, h) {
        V(n) && (n = n(s || 0, e, o));
        var i = e[t],
            a = r !== "get" ? r : V(i) ? l ? e[t.indexOf("set") || !V(e["get" + t.substr(3)]) ? t : "get" + t.substr(3)](l) : e[t]() : i,
            f = V(i) ? l ? xi : Tn : _r,
            p;
        if (Y(n) && (~n.indexOf("random(") && (n = ft(n)), n.charAt(1) === "=" && (p = Xe(a, n) + (W(a) || 0), (p || p === 0) && (n = p))), !h || a !== n || Ut) return !isNaN(a * n) && n !== "" ? (p = new K(this._pt, e, t, +a || 0, n - (a || 0), typeof i == "boolean" ? bi : xn, 0, f), l && (p.fp = l), u && p.modifier(u, this, e), this._pt = p) : (!i && !(t in e) && nr(t, n), mi.call(this, e, t, a, n, f, _ || ie.stringFilter, l))
    },
    gi = function(e, t, r, n, s) {
        if (V(e) && (e = at(e, s, t, r, n)), !he(e) || e.style && e.nodeType || U(e) || Gr(e)) return Y(e) ? at(e, s, t, r, n) : e;
        var o = {},
            u;
        for (u in e) o[u] = at(e[u], s, t, r, n);
        return o
    },
    gn = function(e, t, r, n, s, o) {
        var u, _, l, h;
        if (ee[e] && (u = new ee[e]).init(s, u.rawVars ? t[e] : gi(t[e], n, s, o, r), r, n, o) !== !1 && (r._pt = _ = new K(r._pt, s, e, 0, 1, u.render, u, 0, u.priority), r !== Ne))
            for (l = r._ptLookup[r._targets.indexOf(s)], h = u._props.length; h--;) l[u._props[h]] = _;
        return u
    },
    Te, Ut, fr = function c(e, t, r) {
        var n = e.vars,
            s = n.ease,
            o = n.startAt,
            u = n.immediateRender,
            _ = n.lazy,
            l = n.onUpdate,
            h = n.runBackwards,
            i = n.yoyoEase,
            a = n.keyframes,
            f = n.autoRevert,
            p = e._dur,
            d = e._startAt,
            m = e._targets,
            g = e.parent,
            v = g && g.data === "nested" ? g.vars.targets : m,
            y = e._overwrite === "auto" && !Jt,
            w = e.timeline,
            x, b, A, S, T, k, C, M, P, E, H, z, X;
        if (w && (!a || !s) && (s = "none"), e._ease = Be(s, We.ease), e._yEase = i ? cn(Be(i === !0 ? s : i, We.ease)) : 0, i && e._yoyo && !e._repeat && (i = e._yEase, e._yEase = e._ease, e._ease = i), e._from = !w && !!n.runBackwards, !w || a && !n.stagger) {
            if (M = m[0] ? Re(m[0]).harness : 0, z = M && n[M.prop], x = wt(n, ir), d && (d._zTime < 0 && d.progress(1), t < 0 && h && u && !f ? d.render(-1, !0) : d.revert(h && p ? gt : qn), d._lazy = 0), o) {
                if (Se(e._startAt = N.set(m, ae({
                        data: "isStart",
                        overwrite: !1,
                        parent: g,
                        immediateRender: !0,
                        lazy: !d && Q(_),
                        startAt: null,
                        delay: 0,
                        onUpdate: l && function() {
                            return re(e, "onUpdate")
                        },
                        stagger: 0
                    }, o))), e._startAt._dp = 0, e._startAt._sat = e, t < 0 && (q || !u && !f) && e._startAt.revert(gt), u && p && t <= 0 && r <= 0) {
                    t && (e._zTime = t);
                    return
                }
            } else if (h && p && !d) {
                if (t && (u = !1), A = ae({
                        overwrite: !1,
                        data: "isFromStart",
                        lazy: u && !d && Q(_),
                        immediateRender: u,
                        stagger: 0,
                        parent: g
                    }, x), z && (A[M.prop] = z), Se(e._startAt = N.set(m, A)), e._startAt._dp = 0, e._startAt._sat = e, t < 0 && (q ? e._startAt.revert(gt) : e._startAt.render(-1, !0)), e._zTime = t, !u) c(e._startAt, I, I);
                else if (!t) return
            }
            for (e._pt = e._ptCache = 0, _ = p && Q(_) || _ && !p, b = 0; b < m.length; b++) {
                if (T = m[b], C = T._gsap || ar(m)[b]._gsap, e._ptLookup[b] = E = {}, zt[C.id] && be.length && xt(), H = v === m ? b : v.indexOf(T), M && (P = new M).init(T, z || x, e, H, v) !== !1 && (e._pt = S = new K(e._pt, T, P.name, 0, 1, P.render, P, 0, P.priority), P._props.forEach(function(_e) {
                        E[_e] = S
                    }), P.priority && (k = 1)), !M || z)
                    for (A in x) ee[A] && (P = gn(A, x, e, H, T, v)) ? P.priority && (k = 1) : E[A] = S = ur.call(e, T, A, "get", x[A], H, v, 0, n.stringFilter);
                e._op && e._op[b] && e.kill(T, e._op[b]), y && e._pt && (Te = e, L.killTweensOf(T, E, e.globalTime(t)), X = !e.parent, Te = 0), e._pt && _ && (zt[C.id] = 1)
            }
            k && bn(e), e._onInit && e._onInit(e)
        }
        e._onUpdate = l, e._initted = (!e._op || e._pt) && !X, a && t <= 0 && w.render(ue, !0, !0)
    },
    vi = function(e, t, r, n, s, o, u, _) {
        var l = (e._pt && e._ptCache || (e._ptCache = {}))[t],
            h, i, a, f;
        if (!l)
            for (l = e._ptCache[t] = [], a = e._ptLookup, f = e._targets.length; f--;) {
                if (h = a[f][t], h && h.d && h.d._pt)
                    for (h = h.d._pt; h && h.p !== t && h.fp !== t;) h = h._next;
                if (!h) return Ut = 1, e.vars[t] = "+=0", fr(e, u), Ut = 0, _ ? ot(t + " not eligible for reset") : 1;
                l.push(h)
            }
        for (f = l.length; f--;) i = l[f], h = i._pt || i, h.s = (n || n === 0) && !s ? n : h.s + (n || 0) + o * h.c, h.c = r - h.s, i.e && (i.e = G(r) + W(i.e)), i.b && (i.b = h.s + W(i.b))
    },
    yi = function(e, t) {
        var r = e[0] ? Re(e[0]).harness : 0,
            n = r && r.aliases,
            s, o, u, _;
        if (!n) return t;
        s = Ue({}, t);
        for (o in n)
            if (o in s)
                for (_ = n[o].split(","), u = _.length; u--;) s[_[u]] = s[o];
        return s
    },
    Ti = function(e, t, r, n) {
        var s = t.ease || n || "power1.inOut",
            o, u;
        if (U(t)) u = r[e] || (r[e] = []), t.forEach(function(_, l) {
            return u.push({
                t: l / (t.length - 1) * 100,
                v: _,
                e: s
            })
        });
        else
            for (o in t) u = r[o] || (r[o] = []), o === "ease" || u.push({
                t: parseFloat(e),
                v: t[o],
                e: s
            })
    },
    at = function(e, t, r, n, s) {
        return V(e) ? e.call(t, r, n, s) : Y(e) && ~e.indexOf("random(") ? ft(e) : e
    },
    vn = sr + "repeat,repeatDelay,yoyo,repeatRefresh,yoyoEase,autoRevert",
    yn = {};
Z(vn + ",id,stagger,delay,duration,paused,scrollTrigger", function(c) {
    return yn[c] = 1
});
var N = (function(c) {
    Br(e, c);

    function e(r, n, s, o) {
        var u;
        typeof n == "number" && (s.duration = n, n = s, s = null), u = c.call(this, o ? n : it(n)) || this;
        var _ = u.vars,
            l = _.duration,
            h = _.delay,
            i = _.immediateRender,
            a = _.stagger,
            f = _.overwrite,
            p = _.keyframes,
            d = _.defaults,
            m = _.scrollTrigger,
            g = _.yoyoEase,
            v = n.parent || L,
            y = (U(r) || Gr(r) ? ve(r[0]) : "length" in n) ? [r] : fe(r),
            w, x, b, A, S, T, k, C;
        if (u._targets = y.length ? ar(y) : ot("GSAP target " + r + " not found. https://gsap.com", !ie.nullTargetWarn) || [], u._ptLookup = [], u._overwrite = f, p || a || mt(l) || mt(h)) {
            if (n = u.vars, w = u.timeline = new $({
                    data: "nested",
                    defaults: d || {},
                    targets: v && v.data === "nested" ? v.vars.targets : y
                }), w.kill(), w.parent = w._dp = me(u), w._start = 0, a || mt(l) || mt(h)) {
                if (A = y.length, k = a && rn(a), he(a))
                    for (S in a) ~vn.indexOf(S) && (C || (C = {}), C[S] = a[S]);
                for (x = 0; x < A; x++) b = wt(n, yn), b.stagger = 0, g && (b.yoyoEase = g), C && Ue(b, C), T = y[x], b.duration = +at(l, me(u), x, T, y), b.delay = (+at(h, me(u), x, T, y) || 0) - u._delay, !a && A === 1 && b.delay && (u._delay = h = b.delay, u._start += h, b.delay = 0), w.to(T, b, k ? k(x, T, y) : 0), w._ease = O.none;
                w.duration() ? l = h = 0 : u.timeline = 0
            } else if (p) {
                it(ae(w.vars.defaults, {
                    ease: "none"
                })), w._ease = Be(p.ease || n.ease || "none");
                var M = 0,
                    P, E, H;
                if (U(p)) p.forEach(function(z) {
                    return w.to(y, z, ">")
                }), w.duration();
                else {
                    b = {};
                    for (S in p) S === "ease" || S === "easeEach" || Ti(S, p[S], b, p.easeEach);
                    for (S in b)
                        for (P = b[S].sort(function(z, X) {
                                return z.t - X.t
                            }), M = 0, x = 0; x < P.length; x++) E = P[x], H = {
                            ease: E.e,
                            duration: (E.t - (x ? P[x - 1].t : 0)) / 100 * l
                        }, H[S] = E.v, w.to(y, H, M), M += H.duration;
                    w.duration() < l && w.to({}, {
                        duration: l - w.duration()
                    })
                }
            }
            l || u.duration(l = w.duration())
        } else u.timeline = 0;
        return f === !0 && !Jt && (Te = me(u), L.killTweensOf(y), Te = 0), de(v, me(u), s), n.reversed && u.reverse(), n.paused && u.paused(!0), (i || !l && !p && u._start === R(v._time) && Q(i) && Kn(me(u)) && v.data !== "nested") && (u._tTime = -I, u.render(Math.max(0, -h) || 0)), m && jr(me(u), m), u
    }
    var t = e.prototype;
    return t.render = function(n, s, o) {
        var u = this._time,
            _ = this._tDur,
            l = this._dur,
            h = n < 0,
            i = n > _ - I && !h ? _ : n < I ? 0 : n,
            a, f, p, d, m, g, v, y, w;
        if (!l) Jn(this, n, s, o);
        else if (i !== this._tTime || !n || o || !this._initted && this._tTime || this._startAt && this._zTime < 0 !== h || this._lazy) {
            if (a = i, y = this.timeline, this._repeat) {
                if (d = l + this._rDelay, this._repeat < -1 && h) return this.totalTime(d * 100 + n, s, o);
                if (a = R(i % d), i === _ ? (p = this._repeat, a = l) : (m = R(i / d), p = ~~m, p && p === m ? (a = l, p--) : a > l && (a = l)), g = this._yoyo && p & 1, g && (w = this._yEase, a = l - a), m = $e(this._tTime, d), a === u && !o && this._initted && p === m) return this._tTime = i, this;
                p !== m && (y && this._yEase && hn(y, g), this.vars.repeatRefresh && !g && !this._lock && a !== d && this._initted && (this._lock = o = 1, this.render(R(d * p), !0).invalidate()._lock = 0))
            }
            if (!this._initted) {
                if (Jr(this, h ? n : a, o, s, i)) return this._tTime = 0, this;
                if (u !== this._time && !(o && this.vars.repeatRefresh && p !== m)) return this;
                if (l !== this._dur) return this.render(n, s, o)
            }
            if (this._tTime = i, this._time = a, !this._act && this._ts && (this._act = 1, this._lazy = 0), this.ratio = v = (w || this._ease)(a / l), this._from && (this.ratio = v = 1 - v), !u && i && !s && !m && (re(this, "onStart"), this._tTime !== i)) return this;
            for (f = this._pt; f;) f.r(v, f.d), f = f._next;
            y && y.render(n < 0 ? n : y._dur * y._ease(a / this._dur), s, o) || this._startAt && (this._zTime = n), this._onUpdate && !s && (h && Nt(this, n, s, o), re(this, "onUpdate")), this._repeat && p !== m && this.vars.onRepeat && !s && this.parent && re(this, "onRepeat"), (i === this._tDur || !i) && this._tTime === i && (h && !this._onUpdate && Nt(this, n, !0, !0), (n || !l) && (i === this._tDur && this._ts > 0 || !i && this._ts < 0) && Se(this, 1), !s && !(h && !u) && (i || u || g) && (re(this, i === _ ? "onComplete" : "onReverseComplete", !0), this._prom && !(i < _ && this.timeScale() > 0) && this._prom()))
        }
        return this
    }, t.targets = function() {
        return this._targets
    }, t.invalidate = function(n) {
        return (!n || !this.vars.runBackwards) && (this._startAt = 0), this._pt = this._op = this._onUpdate = this._lazy = this.ratio = 0, this._ptLookup = [], this.timeline && this.timeline.invalidate(n), c.prototype.invalidate.call(this, n)
    }, t.resetTo = function(n, s, o, u, _) {
        _t || te.wake(), this._ts || this.play();
        var l = Math.min(this._dur, (this._dp._time - this._start) * this._ts),
            h;
        return this._initted || fr(this, l), h = this._ease(l / this._dur), vi(this, n, s, o, u, h, l, _) ? this.resetTo(n, s, o, u, 1) : (Mt(this, 0), this.parent || Zr(this._dp, this, "_first", "_last", this._dp._sort ? "_start" : 0), this.render(0))
    }, t.kill = function(n, s) {
        if (s === void 0 && (s = "all"), !n && (!s || s === "all")) return this._lazy = this._pt = 0, this.parent ? rt(this) : this.scrollTrigger && this.scrollTrigger.kill(!!q), this;
        if (this.timeline) {
            var o = this.timeline.totalDuration();
            return this.timeline.killTweensOf(n, s, Te && Te.vars.overwrite !== !0)._first || rt(this), this.parent && o !== this.timeline.totalDuration() && Qe(this, this._dur * this.timeline._tDur / o, 0, 1), this
        }
        var u = this._targets,
            _ = n ? fe(n) : u,
            l = this._ptLookup,
            h = this._pt,
            i, a, f, p, d, m, g;
        if ((!s || s === "all") && Qn(u, _)) return s === "all" && (this._pt = 0), rt(this);
        for (i = this._op = this._op || [], s !== "all" && (Y(s) && (d = {}, Z(s, function(v) {
                return d[v] = 1
            }), s = d), s = yi(u, s)), g = u.length; g--;)
            if (~_.indexOf(u[g])) {
                a = l[g], s === "all" ? (i[g] = s, p = a, f = {}) : (f = i[g] = i[g] || {}, p = s);
                for (d in p) m = a && a[d], m && ((!("kill" in m.d) || m.d.kill(d) === !0) && Ot(this, m, "_pt"), delete a[d]), f !== "all" && (f[d] = 1)
            }
        return this._initted && !this._pt && h && rt(this), this
    }, e.to = function(n, s) {
        return new e(n, s, arguments[2])
    }, e.from = function(n, s) {
        return st(1, arguments)
    }, e.delayedCall = function(n, s, o, u) {
        return new e(s, 0, {
            immediateRender: !1,
            lazy: !1,
            overwrite: !1,
            delay: n,
            onComplete: s,
            onReverseComplete: s,
            onCompleteParams: o,
            onReverseCompleteParams: o,
            callbackScope: u
        })
    }, e.fromTo = function(n, s, o) {
        return st(2, arguments)
    }, e.set = function(n, s) {
        return s.duration = 0, s.repeatDelay || (s.repeat = 0), new e(n, s)
    }, e.killTweensOf = function(n, s, o) {
        return L.killTweensOf(n, s, o)
    }, e
})(lt);
ae(N.prototype, {
    _targets: [],
    _lazy: 0,
    _startAt: 0,
    _op: 0,
    _onInit: 0
});
Z("staggerTo,staggerFrom,staggerFromTo", function(c) {
    N[c] = function() {
        var e = new $,
            t = Yt.call(arguments, 0);
        return t.splice(c === "staggerFromTo" ? 5 : 4, 0, 0), e[c].apply(e, t)
    }
});
var _r = function(e, t, r) {
        return e[t] = r
    },
    Tn = function(e, t, r) {
        return e[t](r)
    },
    xi = function(e, t, r, n) {
        return e[t](n.fp, r)
    },
    wi = function(e, t, r) {
        return e.setAttribute(t, r)
    },
    lr = function(e, t) {
        return V(e[t]) ? Tn : er(e[t]) && e.setAttribute ? wi : _r
    },
    xn = function(e, t) {
        return t.set(t.t, t.p, Math.round((t.s + t.c * e) * 1e6) / 1e6, t)
    },
    bi = function(e, t) {
        return t.set(t.t, t.p, !!(t.s + t.c * e), t)
    },
    wn = function(e, t) {
        var r = t._pt,
            n = "";
        if (!e && t.b) n = t.b;
        else if (e === 1 && t.e) n = t.e;
        else {
            for (; r;) n = r.p + (r.m ? r.m(r.s + r.c * e) : Math.round((r.s + r.c * e) * 1e4) / 1e4) + n, r = r._next;
            n += t.c
        }
        t.set(t.t, t.p, n, t)
    },
    dr = function(e, t) {
        for (var r = t._pt; r;) r.r(e, r.d), r = r._next
    },
    Ai = function(e, t, r, n) {
        for (var s = this._pt, o; s;) o = s._next, s.p === n && s.modifier(e, t, r), s = o
    },
    Si = function(e) {
        for (var t = this._pt, r, n; t;) n = t._next, t.p === e && !t.op || t.op === e ? Ot(this, t, "_pt") : t.dep || (r = 1), t = n;
        return !r
    },
    ki = function(e, t, r, n) {
        n.mSet(e, t, n.m.call(n.tween, r, n.mt), n)
    },
    bn = function(e) {
        for (var t = e._pt, r, n, s, o; t;) {
            for (r = t._next, n = s; n && n.pr > t.pr;) n = n._next;
            (t._prev = n ? n._prev : o) ? t._prev._next = t: s = t, (t._next = n) ? n._prev = t : o = t, t = r
        }
        e._pt = s
    },
    K = (function() {
        function c(t, r, n, s, o, u, _, l, h) {
            this.t = r, this.s = s, this.c = o, this.p = n, this.r = u || xn, this.d = _ || this, this.set = l || _r, this.pr = h || 0, this._next = t, t && (t._prev = this)
        }
        var e = c.prototype;
        return e.modifier = function(r, n, s) {
            this.mSet = this.mSet || this.set, this.set = ki, this.m = r, this.mt = s, this.tween = n
        }, c
    })();
Z(sr + "parent,duration,ease,delay,overwrite,runBackwards,startAt,yoyo,immediateRender,repeat,repeatDelay,data,paused,reversed,lazy,callbackScope,stringFilter,id,yoyoEase,stagger,inherit,repeatRefresh,keyframes,autoRevert,scrollTrigger", function(c) {
    return ir[c] = 1
});
se.TweenMax = se.TweenLite = N;
se.TimelineLite = se.TimelineMax = $;
L = new $({
    sortChildren: !1,
    defaults: We,
    autoRemoveChildren: !0,
    id: "root",
    smoothChildTiming: !0
});
ie.stringFilter = dn;
var Ve = [],
    yt = {},
    Oi = [],
    kr = 0,
    Pi = 0,
    Lt = function(e) {
        return (yt[e] || Oi).map(function(t) {
            return t()
        })
    },
    $t = function() {
        var e = Date.now(),
            t = [];
        e - kr > 2 && (Lt("matchMediaInit"), Ve.forEach(function(r) {
            var n = r.queries,
                s = r.conditions,
                o, u, _, l;
            for (u in n) o = le.matchMedia(n[u]).matches, o && (_ = 1), o !== s[u] && (s[u] = o, l = 1);
            l && (r.revert(), _ && t.push(r))
        }), Lt("matchMediaRevert"), t.forEach(function(r) {
            return r.onMatch(r, function(n) {
                return r.add(null, n)
            })
        }), kr = e, Lt("matchMedia"))
    },
    An = (function() {
        function c(t, r) {
            this.selector = r && qt(r), this.data = [], this._r = [], this.isReverted = !1, this.id = Pi++, t && this.add(t)
        }
        var e = c.prototype;
        return e.add = function(r, n, s) {
            V(r) && (s = n, n = r, r = V);
            var o = this,
                u = function() {
                    var l = F,
                        h = o.selector,
                        i;
                    return l && l !== o && l.data.push(o), s && (o.selector = qt(s)), F = o, i = n.apply(o, arguments), V(i) && o._r.push(i), F = l, o.selector = h, o.isReverted = !1, i
                };
            return o.last = u, r === V ? u(o, function(_) {
                return o.add(null, _)
            }) : r ? o[r] = u : u
        }, e.ignore = function(r) {
            var n = F;
            F = null, r(this), F = n
        }, e.getTweens = function() {
            var r = [];
            return this.data.forEach(function(n) {
                return n instanceof c ? r.push.apply(r, n.getTweens()) : n instanceof N && !(n.parent && n.parent.data === "nested") && r.push(n)
            }), r
        }, e.clear = function() {
            this._r.length = this.data.length = 0
        }, e.kill = function(r, n) {
            var s = this;
            if (r ? (function() {
                    for (var u = s.getTweens(), _ = s.data.length, l; _--;) l = s.data[_], l.data === "isFlip" && (l.revert(), l.getChildren(!0, !0, !1).forEach(function(h) {
                        return u.splice(u.indexOf(h), 1)
                    }));
                    for (u.map(function(h) {
                            return {
                                g: h._dur || h._delay || h._sat && !h._sat.vars.immediateRender ? h.globalTime(0) : -1 / 0,
                                t: h
                            }
                        }).sort(function(h, i) {
                            return i.g - h.g || -1 / 0
                        }).forEach(function(h) {
                            return h.t.revert(r)
                        }), _ = s.data.length; _--;) l = s.data[_], l instanceof $ ? l.data !== "nested" && (l.scrollTrigger && l.scrollTrigger.revert(), l.kill()) : !(l instanceof N) && l.revert && l.revert(r);
                    s._r.forEach(function(h) {
                        return h(r, s)
                    }), s.isReverted = !0
                })() : this.data.forEach(function(u) {
                    return u.kill && u.kill()
                }), this.clear(), n)
                for (var o = Ve.length; o--;) Ve[o].id === this.id && Ve.splice(o, 1)
        }, e.revert = function(r) {
            this.kill(r || {})
        }, c
    })(),
    Mi = (function() {
        function c(t) {
            this.contexts = [], this.scope = t, F && F.data.push(this)
        }
        var e = c.prototype;
        return e.add = function(r, n, s) {
            he(r) || (r = {
                matches: r
            });
            var o = new An(0, s || this.scope),
                u = o.conditions = {},
                _, l, h;
            F && !o.selector && (o.selector = F.selector), this.contexts.push(o), n = o.add("onMatch", n), o.queries = r;
            for (l in r) l === "all" ? h = 1 : (_ = le.matchMedia(r[l]), _ && (Ve.indexOf(o) < 0 && Ve.push(o), (u[l] = _.matches) && (h = 1), _.addListener ? _.addListener($t) : _.addEventListener("change", $t)));
            return h && n(o, function(i) {
                return o.add(null, i)
            }), this
        }, e.revert = function(r) {
            this.kill(r || {})
        }, e.kill = function(r) {
            this.contexts.forEach(function(n) {
                return n.kill(r, !0)
            })
        }, c
    })(),
    At = {
        registerPlugin: function() {
            for (var e = arguments.length, t = new Array(e), r = 0; r < e; r++) t[r] = arguments[r];
            t.forEach(function(n) {
                return fn(n)
            })
        },
        timeline: function(e) {
            return new $(e)
        },
        getTweensOf: function(e, t) {
            return L.getTweensOf(e, t)
        },
        getProperty: function(e, t, r, n) {
            Y(e) && (e = fe(e)[0]);
            var s = Re(e || {}).get,
                o = r ? Qr : $r;
            return r === "native" && (r = ""), e && (t ? o((ee[t] && ee[t].get || s)(e, t, r, n)) : function(u, _, l) {
                return o((ee[u] && ee[u].get || s)(e, u, _, l))
            })
        },
        quickSetter: function(e, t, r) {
            if (e = fe(e), e.length > 1) {
                var n = e.map(function(h) {
                        return J.quickSetter(h, t, r)
                    }),
                    s = n.length;
                return function(h) {
                    for (var i = s; i--;) n[i](h)
                }
            }
            e = e[0] || {};
            var o = ee[t],
                u = Re(e),
                _ = u.harness && (u.harness.aliases || {})[t] || t,
                l = o ? function(h) {
                    var i = new o;
                    Ne._pt = 0, i.init(e, r ? h + r : h, Ne, 0, [e]), i.render(1, i), Ne._pt && dr(1, Ne)
                } : u.set(e, _);
            return o ? l : function(h) {
                return l(e, _, r ? h + r : h, u, 1)
            }
        },
        quickTo: function(e, t, r) {
            var n, s = J.to(e, ae((n = {}, n[t] = "+=0.1", n.paused = !0, n.stagger = 0, n), r || {})),
                o = function(_, l, h) {
                    return s.resetTo(t, _, l, h)
                };
            return o.tween = s, o
        },
        isTweening: function(e) {
            return L.getTweensOf(e, !0).length > 0
        },
        defaults: function(e) {
            return e && e.ease && (e.ease = Be(e.ease, We.ease)), xr(We, e || {})
        },
        config: function(e) {
            return xr(ie, e || {})
        },
        registerEffect: function(e) {
            var t = e.name,
                r = e.effect,
                n = e.plugins,
                s = e.defaults,
                o = e.extendTimeline;
            (n || "").split(",").forEach(function(u) {
                return u && !ee[u] && !se[u] && ot(t + " effect requires " + u + " plugin.")
            }), It[t] = function(u, _, l) {
                return r(fe(u), ae(_ || {}, s), l)
            }, o && ($.prototype[t] = function(u, _, l) {
                return this.add(It[t](u, he(_) ? _ : (l = _) && {}, this), l)
            })
        },
        registerEase: function(e, t) {
            O[e] = Be(t)
        },
        parseEase: function(e, t) {
            return arguments.length ? Be(e, t) : O
        },
        getById: function(e) {
            return L.getById(e)
        },
        exportRoot: function(e, t) {
            e === void 0 && (e = {});
            var r = new $(e),
                n, s;
            for (r.smoothChildTiming = Q(e.smoothChildTiming), L.remove(r), r._dp = 0, r._time = r._tTime = L._time, n = L._first; n;) s = n._next, (t || !(!n._dur && n instanceof N && n.vars.onComplete === n._targets[0])) && de(r, n, n._start - n._delay), n = s;
            return de(L, r, 0), r
        },
        context: function(e, t) {
            return e ? new An(e, t) : F
        },
        matchMedia: function(e) {
            return new Mi(e)
        },
        matchMediaRefresh: function() {
            return Ve.forEach(function(e) {
                var t = e.conditions,
                    r, n;
                for (n in t) t[n] && (t[n] = !1, r = 1);
                r && e.revert()
            }) || $t()
        },
        addEventListener: function(e, t) {
            var r = yt[e] || (yt[e] = []);
            ~r.indexOf(t) || r.push(t)
        },
        removeEventListener: function(e, t) {
            var r = yt[e],
                n = r && r.indexOf(t);
            n >= 0 && r.splice(n, 1)
        },
        utils: {
            wrap: oi,
            wrapYoyo: ui,
            distribute: rn,
            random: sn,
            snap: nn,
            normalize: ai,
            getUnit: W,
            clamp: ri,
            splitColor: _n,
            toArray: fe,
            selector: qt,
            mapRange: on,
            pipe: ii,
            unitize: si,
            interpolate: fi,
            shuffle: tn
        },
        install: Xr,
        effects: It,
        ticker: te,
        updateRoot: $.updateRoot,
        plugins: ee,
        globalTimeline: L,
        core: {
            PropTween: K,
            globals: Yr,
            Tween: N,
            Timeline: $,
            Animation: lt,
            getCache: Re,
            _removeLinkedListItem: Ot,
            reverting: function() {
                return q
            },
            context: function(e) {
                return e && F && (F.data.push(e), e._ctx = F), F
            },
            suppressOverwrites: function(e) {
                return Jt = e
            }
        }
    };
Z("to,from,fromTo,delayedCall,set,killTweensOf", function(c) {
    return At[c] = N[c]
});
te.add($.updateRoot);
Ne = At.to({}, {
    duration: 0
});
var Ci = function(e, t) {
        for (var r = e._pt; r && r.p !== t && r.op !== t && r.fp !== t;) r = r._next;
        return r
    },
    Di = function(e, t) {
        var r = e._targets,
            n, s, o;
        for (n in t)
            for (s = r.length; s--;) o = e._ptLookup[s][n], o && (o = o.d) && (o._pt && (o = Ci(o, n)), o && o.modifier && o.modifier(t[n], e, r[s], n))
    },
    Bt = function(e, t) {
        return {
            name: e,
            headless: 1,
            rawVars: 1,
            init: function(n, s, o) {
                o._onInit = function(u) {
                    var _, l;
                    if (Y(s) && (_ = {}, Z(s, function(h) {
                            return _[h] = 1
                        }), s = _), t) {
                        _ = {};
                        for (l in s) _[l] = t(s[l]);
                        s = _
                    }
                    Di(u, s)
                }
            }
        }
    },
    J = At.registerPlugin({
        name: "attr",
        init: function(e, t, r, n, s) {
            var o, u, _;
            this.tween = r;
            for (o in t) _ = e.getAttribute(o) || "", u = this.add(e, "setAttribute", (_ || 0) + "", t[o], n, s, 0, 0, o), u.op = o, u.b = _, this._props.push(o)
        },
        render: function(e, t) {
            for (var r = t._pt; r;) q ? r.set(r.t, r.p, r.b, r) : r.r(e, r.d), r = r._next
        }
    }, {
        name: "endArray",
        headless: 1,
        init: function(e, t) {
            for (var r = t.length; r--;) this.add(e, r, e[r] || 0, t[r], 0, 0, 0, 0, 0, 1)
        }
    }, Bt("roundProps", Wt), Bt("modifiers"), Bt("snap", nn)) || At;
N.version = $.version = J.version = "3.14.2";
Nr = 1;
tr() && Ze();
O.Power0;
O.Power1;
O.Power2;
O.Power3;
O.Power4;
O.Linear;
O.Quad;
O.Cubic;
O.Quart;
O.Quint;
O.Strong;
O.Elastic;
O.Back;
O.SteppedEase;
O.Bounce;
O.Sine;
O.Expo;
O.Circ;
var Or, xe, Ye, cr, Fe, Pr, hr, Ii = function() {
        return typeof window < "u"
    },
    ye = {},
    Ee = 180 / Math.PI,
    qe = Math.PI / 180,
    He = Math.atan2,
    Mr = 1e8,
    pr = /([A-Z])/g,
    Ei = /(left|right|width|margin|padding|x)/i,
    Fi = /[\s,\(]\S/,
    ce = {
        autoAlpha: "opacity,visibility",
        scale: "scaleX,scaleY",
        alpha: "opacity"
    },
    Qt = function(e, t) {
        return t.set(t.t, t.p, Math.round((t.s + t.c * e) * 1e4) / 1e4 + t.u, t)
    },
    Ri = function(e, t) {
        return t.set(t.t, t.p, e === 1 ? t.e : Math.round((t.s + t.c * e) * 1e4) / 1e4 + t.u, t)
    },
    Li = function(e, t) {
        return t.set(t.t, t.p, e ? Math.round((t.s + t.c * e) * 1e4) / 1e4 + t.u : t.b, t)
    },
    Bi = function(e, t) {
        return t.set(t.t, t.p, e === 1 ? t.e : e ? Math.round((t.s + t.c * e) * 1e4) / 1e4 + t.u : t.b, t)
    },
    Vi = function(e, t) {
        var r = t.s + t.c * e;
        t.set(t.t, t.p, ~~(r + (r < 0 ? -.5 : .5)) + t.u, t)
    },
    Sn = function(e, t) {
        return t.set(t.t, t.p, e ? t.e : t.b, t)
    },
    kn = function(e, t) {
        return t.set(t.t, t.p, e !== 1 ? t.b : t.e, t)
    },
    Gi = function(e, t, r) {
        return e.style[t] = r
    },
    Hi = function(e, t, r) {
        return e.style.setProperty(t, r)
    },
    zi = function(e, t, r) {
        return e._gsap[t] = r
    },
    Ni = function(e, t, r) {
        return e._gsap.scaleX = e._gsap.scaleY = r
    },
    Xi = function(e, t, r, n, s) {
        var o = e._gsap;
        o.scaleX = o.scaleY = r, o.renderTransform(s, o)
    },
    Yi = function(e, t, r, n, s) {
        var o = e._gsap;
        o[t] = r, o.renderTransform(s, o)
    },
    B = "transform",
    j = B + "Origin",
    qi = function c(e, t) {
        var r = this,
            n = this.target,
            s = n.style,
            o = n._gsap;
        if (e in ye && s) {
            if (this.tfm = this.tfm || {}, e !== "transform") e = ce[e] || e, ~e.indexOf(",") ? e.split(",").forEach(function(u) {
                return r.tfm[u] = ge(n, u)
            }) : this.tfm[e] = o.x ? o[e] : ge(n, e), e === j && (this.tfm.zOrigin = o.zOrigin);
            else return ce.transform.split(",").forEach(function(u) {
                return c.call(r, u, t)
            });
            if (this.props.indexOf(B) >= 0) return;
            o.svg && (this.svgo = n.getAttribute("data-svg-origin"), this.props.push(j, t, "")), e = B
        }(s || t) && this.props.push(e, t, s[e])
    },
    On = function(e) {
        e.translate && (e.removeProperty("translate"), e.removeProperty("scale"), e.removeProperty("rotate"))
    },
    Wi = function() {
        var e = this.props,
            t = this.target,
            r = t.style,
            n = t._gsap,
            s, o;
        for (s = 0; s < e.length; s += 3) e[s + 1] ? e[s + 1] === 2 ? t[e[s]](e[s + 2]) : t[e[s]] = e[s + 2] : e[s + 2] ? r[e[s]] = e[s + 2] : r.removeProperty(e[s].substr(0, 2) === "--" ? e[s] : e[s].replace(pr, "-$1").toLowerCase());
        if (this.tfm) {
            for (o in this.tfm) n[o] = this.tfm[o];
            n.svg && (n.renderTransform(), t.setAttribute("data-svg-origin", this.svgo || "")), s = hr(), (!s || !s.isStart) && !r[B] && (On(r), n.zOrigin && r[j] && (r[j] += " " + n.zOrigin + "px", n.zOrigin = 0, n.renderTransform()), n.uncache = 1)
        }
    },
    Pn = function(e, t) {
        var r = {
            target: e,
            props: [],
            revert: Wi,
            save: qi
        };
        return e._gsap || J.core.getCache(e), t && e.style && e.nodeType && t.split(",").forEach(function(n) {
            return r.save(n)
        }), r
    },
    Mn, Zt = function(e, t) {
        var r = xe.createElementNS ? xe.createElementNS((t || "http://www.w3.org/1999/xhtml").replace(/^https/, "http"), e) : xe.createElement(e);
        return r && r.style ? r : xe.createElement(e)
    },
    ne = function c(e, t, r) {
        var n = getComputedStyle(e);
        return n[t] || n.getPropertyValue(t.replace(pr, "-$1").toLowerCase()) || n.getPropertyValue(t) || !r && c(e, Ke(t) || t, 1) || ""
    },
    Cr = "O,Moz,ms,Ms,Webkit".split(","),
    Ke = function(e, t, r) {
        var n = t || Fe,
            s = n.style,
            o = 5;
        if (e in s && !r) return e;
        for (e = e.charAt(0).toUpperCase() + e.substr(1); o-- && !(Cr[o] + e in s););
        return o < 0 ? null : (o === 3 ? "ms" : o >= 0 ? Cr[o] : "") + e
    },
    Kt = function() {
        Ii() && window.document && (Or = window, xe = Or.document, Ye = xe.documentElement, Fe = Zt("div") || {
            style: {}
        }, Zt("div"), B = Ke(B), j = B + "Origin", Fe.style.cssText = "border-width:0;line-height:0;position:absolute;padding:0", Mn = !!Ke("perspective"), hr = J.core.reverting, cr = 1)
    },
    Dr = function(e) {
        var t = e.ownerSVGElement,
            r = Zt("svg", t && t.getAttribute("xmlns") || "http://www.w3.org/2000/svg"),
            n = e.cloneNode(!0),
            s;
        n.style.display = "block", r.appendChild(n), Ye.appendChild(r);
        try {
            s = n.getBBox()
        } catch {}
        return r.removeChild(n), Ye.removeChild(r), s
    },
    Ir = function(e, t) {
        for (var r = t.length; r--;)
            if (e.hasAttribute(t[r])) return e.getAttribute(t[r])
    },
    Cn = function(e) {
        var t, r;
        try {
            t = e.getBBox()
        } catch {
            t = Dr(e), r = 1
        }
        return t && (t.width || t.height) || r || (t = Dr(e)), t && !t.width && !t.x && !t.y ? {
            x: +Ir(e, ["x", "cx", "x1"]) || 0,
            y: +Ir(e, ["y", "cy", "y1"]) || 0,
            width: 0,
            height: 0
        } : t
    },
    Dn = function(e) {
        return !!(e.getCTM && (!e.parentNode || e.ownerSVGElement) && Cn(e))
    },
    ke = function(e, t) {
        if (t) {
            var r = e.style,
                n;
            t in ye && t !== j && (t = B), r.removeProperty ? (n = t.substr(0, 2), (n === "ms" || t.substr(0, 6) === "webkit") && (t = "-" + t), r.removeProperty(n === "--" ? t : t.replace(pr, "-$1").toLowerCase())) : r.removeAttribute(t)
        }
    },
    we = function(e, t, r, n, s, o) {
        var u = new K(e._pt, t, r, 0, 1, o ? kn : Sn);
        return e._pt = u, u.b = n, u.e = s, e._props.push(r), u
    },
    Er = {
        deg: 1,
        rad: 1,
        turn: 1
    },
    Ui = {
        grid: 1,
        flex: 1
    },
    Oe = function c(e, t, r, n) {
        var s = parseFloat(r) || 0,
            o = (r + "").trim().substr((s + "").length) || "px",
            u = Fe.style,
            _ = Ei.test(t),
            l = e.tagName.toLowerCase() === "svg",
            h = (l ? "client" : "offset") + (_ ? "Width" : "Height"),
            i = 100,
            a = n === "px",
            f = n === "%",
            p, d, m, g;
        if (n === o || !s || Er[n] || Er[o]) return s;
        if (o !== "px" && !a && (s = c(e, t, r, "px")), g = e.getCTM && Dn(e), (f || o === "%") && (ye[t] || ~t.indexOf("adius"))) return p = g ? e.getBBox()[_ ? "width" : "height"] : e[h], G(f ? s / p * i : s / 100 * p);
        if (u[_ ? "width" : "height"] = i + (a ? o : n), d = n !== "rem" && ~t.indexOf("adius") || n === "em" && e.appendChild && !l ? e : e.parentNode, g && (d = (e.ownerSVGElement || {}).parentNode), (!d || d === xe || !d.appendChild) && (d = xe.body), m = d._gsap, m && f && m.width && _ && m.time === te.time && !m.uncache) return G(s / m.width * i);
        if (f && (t === "height" || t === "width")) {
            var v = e.style[t];
            e.style[t] = i + n, p = e[h], v ? e.style[t] = v : ke(e, t)
        } else(f || o === "%") && !Ui[ne(d, "display")] && (u.position = ne(e, "position")), d === e && (u.position = "static"), d.appendChild(Fe), p = Fe[h], d.removeChild(Fe), u.position = "absolute";
        return _ && f && (m = Re(d), m.time = te.time, m.width = d[h]), G(a ? p * s / i : p && s ? i / p * s : 0)
    },
    ge = function(e, t, r, n) {
        var s;
        return cr || Kt(), t in ce && t !== "transform" && (t = ce[t], ~t.indexOf(",") && (t = t.split(",")[0])), ye[t] && t !== "transform" ? (s = ct(e, n), s = t !== "transformOrigin" ? s[t] : s.svg ? s.origin : kt(ne(e, j)) + " " + s.zOrigin + "px") : (s = e.style[t], (!s || s === "auto" || n || ~(s + "").indexOf("calc(")) && (s = St[t] && St[t](e, t, r) || ne(e, t) || Wr(e, t) || (t === "opacity" ? 1 : 0))), r && !~(s + "").trim().indexOf(" ") ? Oe(e, t, s, r) + r : s
    },
    $i = function(e, t, r, n) {
        if (!r || r === "none") {
            var s = Ke(t, e, 1),
                o = s && ne(e, s, 1);
            o && o !== r ? (t = s, r = o) : t === "borderColor" && (r = ne(e, "borderTopColor"))
        }
        var u = new K(this._pt, e.style, t, 0, 1, wn),
            _ = 0,
            l = 0,
            h, i, a, f, p, d, m, g, v, y, w, x;
        if (u.b = r, u.e = n, r += "", n += "", n.substring(0, 6) === "var(--" && (n = ne(e, n.substring(4, n.indexOf(")")))), n === "auto" && (d = e.style[t], e.style[t] = n, n = ne(e, t) || n, d ? e.style[t] = d : ke(e, t)), h = [r, n], dn(h), r = h[0], n = h[1], a = r.match(ze) || [], x = n.match(ze) || [], x.length) {
            for (; i = ze.exec(n);) m = i[0], v = n.substring(_, i.index), p ? p = (p + 1) % 5 : (v.substr(-5) === "rgba(" || v.substr(-5) === "hsla(") && (p = 1), m !== (d = a[l++] || "") && (f = parseFloat(d) || 0, w = d.substr((f + "").length), m.charAt(1) === "=" && (m = Xe(f, m) + w), g = parseFloat(m), y = m.substr((g + "").length), _ = ze.lastIndex - y.length, y || (y = y || ie.units[t] || w, _ === n.length && (n += y, u.e += y)), w !== y && (f = Oe(e, t, d, y) || 0), u._pt = {
                _next: u._pt,
                p: v || l === 1 ? v : ",",
                s: f,
                c: g - f,
                m: p && p < 4 || t === "zIndex" ? Math.round : 0
            });
            u.c = _ < n.length ? n.substring(_, n.length) : ""
        } else u.r = t === "display" && n === "none" ? kn : Sn;
        return zr.test(n) && (u.e = 0), this._pt = u, u
    },
    Fr = {
        top: "0%",
        bottom: "100%",
        left: "0%",
        right: "100%",
        center: "50%"
    },
    Qi = function(e) {
        var t = e.split(" "),
            r = t[0],
            n = t[1] || "50%";
        return (r === "top" || r === "bottom" || n === "left" || n === "right") && (e = r, r = n, n = e), t[0] = Fr[r] || r, t[1] = Fr[n] || n, t.join(" ")
    },
    Zi = function(e, t) {
        if (t.tween && t.tween._time === t.tween._dur) {
            var r = t.t,
                n = r.style,
                s = t.u,
                o = r._gsap,
                u, _, l;
            if (s === "all" || s === !0) n.cssText = "", _ = 1;
            else
                for (s = s.split(","), l = s.length; --l > -1;) u = s[l], ye[u] && (_ = 1, u = u === "transformOrigin" ? j : B), ke(r, u);
            _ && (ke(r, B), o && (o.svg && r.removeAttribute("transform"), n.scale = n.rotate = n.translate = "none", ct(r, 1), o.uncache = 1, On(n)))
        }
    },
    St = {
        clearProps: function(e, t, r, n, s) {
            if (s.data !== "isFromStart") {
                var o = e._pt = new K(e._pt, t, r, 0, 0, Zi);
                return o.u = n, o.pr = -10, o.tween = s, e._props.push(r), 1
            }
        }
    },
    dt = [1, 0, 0, 1, 0, 0],
    In = {},
    En = function(e) {
        return e === "matrix(1, 0, 0, 1, 0, 0)" || e === "none" || !e
    },
    Rr = function(e) {
        var t = ne(e, B);
        return En(t) ? dt : t.substr(7).match(Hr).map(G)
    },
    mr = function(e, t) {
        var r = e._gsap || Re(e),
            n = e.style,
            s = Rr(e),
            o, u, _, l;
        return r.svg && e.getAttribute("transform") ? (_ = e.transform.baseVal.consolidate().matrix, s = [_.a, _.b, _.c, _.d, _.e, _.f], s.join(",") === "1,0,0,1,0,0" ? dt : s) : (s === dt && !e.offsetParent && e !== Ye && !r.svg && (_ = n.display, n.display = "block", o = e.parentNode, (!o || !e.offsetParent && !e.getBoundingClientRect().width) && (l = 1, u = e.nextElementSibling, Ye.appendChild(e)), s = Rr(e), _ ? n.display = _ : ke(e, "display"), l && (u ? o.insertBefore(e, u) : o ? o.appendChild(e) : Ye.removeChild(e))), t && s.length > 6 ? [s[0], s[1], s[4], s[5], s[12], s[13]] : s)
    },
    jt = function(e, t, r, n, s, o) {
        var u = e._gsap,
            _ = s || mr(e, !0),
            l = u.xOrigin || 0,
            h = u.yOrigin || 0,
            i = u.xOffset || 0,
            a = u.yOffset || 0,
            f = _[0],
            p = _[1],
            d = _[2],
            m = _[3],
            g = _[4],
            v = _[5],
            y = t.split(" "),
            w = parseFloat(y[0]) || 0,
            x = parseFloat(y[1]) || 0,
            b, A, S, T;
        r ? _ !== dt && (A = f * m - p * d) && (S = w * (m / A) + x * (-d / A) + (d * v - m * g) / A, T = w * (-p / A) + x * (f / A) - (f * v - p * g) / A, w = S, x = T) : (b = Cn(e), w = b.x + (~y[0].indexOf("%") ? w / 100 * b.width : w), x = b.y + (~(y[1] || y[0]).indexOf("%") ? x / 100 * b.height : x)), n || n !== !1 && u.smooth ? (g = w - l, v = x - h, u.xOffset = i + (g * f + v * d) - g, u.yOffset = a + (g * p + v * m) - v) : u.xOffset = u.yOffset = 0, u.xOrigin = w, u.yOrigin = x, u.smooth = !!n, u.origin = t, u.originIsAbsolute = !!r, e.style[j] = "0px 0px", o && (we(o, u, "xOrigin", l, w), we(o, u, "yOrigin", h, x), we(o, u, "xOffset", i, u.xOffset), we(o, u, "yOffset", a, u.yOffset)), e.setAttribute("data-svg-origin", w + " " + x)
    },
    ct = function(e, t) {
        var r = e._gsap || new mn(e);
        if ("x" in r && !t && !r.uncache) return r;
        var n = e.style,
            s = r.scaleX < 0,
            o = "px",
            u = "deg",
            _ = getComputedStyle(e),
            l = ne(e, j) || "0",
            h, i, a, f, p, d, m, g, v, y, w, x, b, A, S, T, k, C, M, P, E, H, z, X, _e, pt, je, Je, Me, gr, pe, Ce;
        return h = i = a = d = m = g = v = y = w = 0, f = p = 1, r.svg = !!(e.getCTM && Dn(e)), _.translate && ((_.translate !== "none" || _.scale !== "none" || _.rotate !== "none") && (n[B] = (_.translate !== "none" ? "translate3d(" + (_.translate + " 0 0").split(" ").slice(0, 3).join(", ") + ") " : "") + (_.rotate !== "none" ? "rotate(" + _.rotate + ") " : "") + (_.scale !== "none" ? "scale(" + _.scale.split(" ").join(",") + ") " : "") + (_[B] !== "none" ? _[B] : "")), n.scale = n.rotate = n.translate = "none"), A = mr(e, r.svg), r.svg && (r.uncache ? (_e = e.getBBox(), l = r.xOrigin - _e.x + "px " + (r.yOrigin - _e.y) + "px", X = "") : X = !t && e.getAttribute("data-svg-origin"), jt(e, X || l, !!X || r.originIsAbsolute, r.smooth !== !1, A)), x = r.xOrigin || 0, b = r.yOrigin || 0, A !== dt && (C = A[0], M = A[1], P = A[2], E = A[3], h = H = A[4], i = z = A[5], A.length === 6 ? (f = Math.sqrt(C * C + M * M), p = Math.sqrt(E * E + P * P), d = C || M ? He(M, C) * Ee : 0, v = P || E ? He(P, E) * Ee + d : 0, v && (p *= Math.abs(Math.cos(v * qe))), r.svg && (h -= x - (x * C + b * P), i -= b - (x * M + b * E))) : (Ce = A[6], gr = A[7], je = A[8], Je = A[9], Me = A[10], pe = A[11], h = A[12], i = A[13], a = A[14], S = He(Ce, Me), m = S * Ee, S && (T = Math.cos(-S), k = Math.sin(-S), X = H * T + je * k, _e = z * T + Je * k, pt = Ce * T + Me * k, je = H * -k + je * T, Je = z * -k + Je * T, Me = Ce * -k + Me * T, pe = gr * -k + pe * T, H = X, z = _e, Ce = pt), S = He(-P, Me), g = S * Ee, S && (T = Math.cos(-S), k = Math.sin(-S), X = C * T - je * k, _e = M * T - Je * k, pt = P * T - Me * k, pe = E * k + pe * T, C = X, M = _e, P = pt), S = He(M, C), d = S * Ee, S && (T = Math.cos(S), k = Math.sin(S), X = C * T + M * k, _e = H * T + z * k, M = M * T - C * k, z = z * T - H * k, C = X, H = _e), m && Math.abs(m) + Math.abs(d) > 359.9 && (m = d = 0, g = 180 - g), f = G(Math.sqrt(C * C + M * M + P * P)), p = G(Math.sqrt(z * z + Ce * Ce)), S = He(H, z), v = Math.abs(S) > 2e-4 ? S * Ee : 0, w = pe ? 1 / (pe < 0 ? -pe : pe) : 0), r.svg && (X = e.getAttribute("transform"), r.forceCSS = e.setAttribute("transform", "") || !En(ne(e, B)), X && e.setAttribute("transform", X))), Math.abs(v) > 90 && Math.abs(v) < 270 && (s ? (f *= -1, v += d <= 0 ? 180 : -180, d += d <= 0 ? 180 : -180) : (p *= -1, v += v <= 0 ? 180 : -180)), t = t || r.uncache, r.x = h - ((r.xPercent = h && (!t && r.xPercent || (Math.round(e.offsetWidth / 2) === Math.round(-h) ? -50 : 0))) ? e.offsetWidth * r.xPercent / 100 : 0) + o, r.y = i - ((r.yPercent = i && (!t && r.yPercent || (Math.round(e.offsetHeight / 2) === Math.round(-i) ? -50 : 0))) ? e.offsetHeight * r.yPercent / 100 : 0) + o, r.z = a + o, r.scaleX = G(f), r.scaleY = G(p), r.rotation = G(d) + u, r.rotationX = G(m) + u, r.rotationY = G(g) + u, r.skewX = v + u, r.skewY = y + u, r.transformPerspective = w + o, (r.zOrigin = parseFloat(l.split(" ")[2]) || !t && r.zOrigin || 0) && (n[j] = kt(l)), r.xOffset = r.yOffset = 0, r.force3D = ie.force3D, r.renderTransform = r.svg ? ji : Mn ? Fn : Ki, r.uncache = 0, r
    },
    kt = function(e) {
        return (e = e.split(" "))[0] + " " + e[1]
    },
    Vt = function(e, t, r) {
        var n = W(t);
        return G(parseFloat(t) + parseFloat(Oe(e, "x", r + "px", n))) + n
    },
    Ki = function(e, t) {
        t.z = "0px", t.rotationY = t.rotationX = "0deg", t.force3D = 0, Fn(e, t)
    },
    De = "0deg",
    tt = "0px",
    Ie = ") ",
    Fn = function(e, t) {
        var r = t || this,
            n = r.xPercent,
            s = r.yPercent,
            o = r.x,
            u = r.y,
            _ = r.z,
            l = r.rotation,
            h = r.rotationY,
            i = r.rotationX,
            a = r.skewX,
            f = r.skewY,
            p = r.scaleX,
            d = r.scaleY,
            m = r.transformPerspective,
            g = r.force3D,
            v = r.target,
            y = r.zOrigin,
            w = "",
            x = g === "auto" && e && e !== 1 || g === !0;
        if (y && (i !== De || h !== De)) {
            var b = parseFloat(h) * qe,
                A = Math.sin(b),
                S = Math.cos(b),
                T;
            b = parseFloat(i) * qe, T = Math.cos(b), o = Vt(v, o, A * T * -y), u = Vt(v, u, -Math.sin(b) * -y), _ = Vt(v, _, S * T * -y + y)
        }
        m !== tt && (w += "perspective(" + m + Ie), (n || s) && (w += "translate(" + n + "%, " + s + "%) "), (x || o !== tt || u !== tt || _ !== tt) && (w += _ !== tt || x ? "translate3d(" + o + ", " + u + ", " + _ + ") " : "translate(" + o + ", " + u + Ie), l !== De && (w += "rotate(" + l + Ie), h !== De && (w += "rotateY(" + h + Ie), i !== De && (w += "rotateX(" + i + Ie), (a !== De || f !== De) && (w += "skew(" + a + ", " + f + Ie), (p !== 1 || d !== 1) && (w += "scale(" + p + ", " + d + Ie), v.style[B] = w || "translate(0, 0)"
    },
    ji = function(e, t) {
        var r = t || this,
            n = r.xPercent,
            s = r.yPercent,
            o = r.x,
            u = r.y,
            _ = r.rotation,
            l = r.skewX,
            h = r.skewY,
            i = r.scaleX,
            a = r.scaleY,
            f = r.target,
            p = r.xOrigin,
            d = r.yOrigin,
            m = r.xOffset,
            g = r.yOffset,
            v = r.forceCSS,
            y = parseFloat(o),
            w = parseFloat(u),
            x, b, A, S, T;
        _ = parseFloat(_), l = parseFloat(l), h = parseFloat(h), h && (h = parseFloat(h), l += h, _ += h), _ || l ? (_ *= qe, l *= qe, x = Math.cos(_) * i, b = Math.sin(_) * i, A = Math.sin(_ - l) * -a, S = Math.cos(_ - l) * a, l && (h *= qe, T = Math.tan(l - h), T = Math.sqrt(1 + T * T), A *= T, S *= T, h && (T = Math.tan(h), T = Math.sqrt(1 + T * T), x *= T, b *= T)), x = G(x), b = G(b), A = G(A), S = G(S)) : (x = i, S = a, b = A = 0), (y && !~(o + "").indexOf("px") || w && !~(u + "").indexOf("px")) && (y = Oe(f, "x", o, "px"), w = Oe(f, "y", u, "px")), (p || d || m || g) && (y = G(y + p - (p * x + d * A) + m), w = G(w + d - (p * b + d * S) + g)), (n || s) && (T = f.getBBox(), y = G(y + n / 100 * T.width), w = G(w + s / 100 * T.height)), T = "matrix(" + x + "," + b + "," + A + "," + S + "," + y + "," + w + ")", f.setAttribute("transform", T), v && (f.style[B] = T)
    },
    Ji = function(e, t, r, n, s) {
        var o = 360,
            u = Y(s),
            _ = parseFloat(s) * (u && ~s.indexOf("rad") ? Ee : 1),
            l = _ - n,
            h = n + l + "deg",
            i, a;
        return u && (i = s.split("_")[1], i === "short" && (l %= o, l !== l % (o / 2) && (l += l < 0 ? o : -o)), i === "cw" && l < 0 ? l = (l + o * Mr) % o - ~~(l / o) * o : i === "ccw" && l > 0 && (l = (l - o * Mr) % o - ~~(l / o) * o)), e._pt = a = new K(e._pt, t, r, n, l, Ri), a.e = h, a.u = "deg", e._props.push(r), a
    },
    Lr = function(e, t) {
        for (var r in t) e[r] = t[r];
        return e
    },
    es = function(e, t, r) {
        var n = Lr({}, r._gsap),
            s = "perspective,force3D,transformOrigin,svgOrigin",
            o = r.style,
            u, _, l, h, i, a, f, p;
        n.svg ? (l = r.getAttribute("transform"), r.setAttribute("transform", ""), o[B] = t, u = ct(r, 1), ke(r, B), r.setAttribute("transform", l)) : (l = getComputedStyle(r)[B], o[B] = t, u = ct(r, 1), o[B] = l);
        for (_ in ye) l = n[_], h = u[_], l !== h && s.indexOf(_) < 0 && (f = W(l), p = W(h), i = f !== p ? Oe(r, _, l, p) : parseFloat(l), a = parseFloat(h), e._pt = new K(e._pt, u, _, i, a - i, Qt), e._pt.u = p || 0, e._props.push(_));
        Lr(u, n)
    };
Z("padding,margin,Width,Radius", function(c, e) {
    var t = "Top",
        r = "Right",
        n = "Bottom",
        s = "Left",
        o = (e < 3 ? [t, r, n, s] : [t + s, t + r, n + r, n + s]).map(function(u) {
            return e < 2 ? c + u : "border" + u + c
        });
    St[e > 1 ? "border" + c : c] = function(u, _, l, h, i) {
        var a, f;
        if (arguments.length < 4) return a = o.map(function(p) {
            return ge(u, p, l)
        }), f = a.join(" "), f.split(a[0]).length === 5 ? a[0] : f;
        a = (h + "").split(" "), f = {}, o.forEach(function(p, d) {
            return f[p] = a[d] = a[d] || a[(d - 1) / 2 | 0]
        }), u.init(_, f, i)
    }
});
var Rn = {
    name: "css",
    register: Kt,
    targetTest: function(e) {
        return e.style && e.nodeType
    },
    init: function(e, t, r, n, s) {
        var o = this._props,
            u = e.style,
            _ = r.vars.startAt,
            l, h, i, a, f, p, d, m, g, v, y, w, x, b, A, S, T;
        cr || Kt(), this.styles = this.styles || Pn(e), S = this.styles.props, this.tween = r;
        for (d in t)
            if (d !== "autoRound" && (h = t[d], !(ee[d] && gn(d, t, r, n, e, s)))) {
                if (f = typeof h, p = St[d], f === "function" && (h = h.call(r, n, e, s), f = typeof h), f === "string" && ~h.indexOf("random(") && (h = ft(h)), p) p(this, e, d, h, r) && (A = 1);
                else if (d.substr(0, 2) === "--") l = (getComputedStyle(e).getPropertyValue(d) + "").trim(), h += "", Ae.lastIndex = 0, Ae.test(l) || (m = W(l), g = W(h), g ? m !== g && (l = Oe(e, d, l, g) + g) : m && (h += m)), this.add(u, "setProperty", l, h, n, s, 0, 0, d), o.push(d), S.push(d, 0, u[d]);
                else if (f !== "undefined") {
                    if (_ && d in _ ? (l = typeof _[d] == "function" ? _[d].call(r, n, e, s) : _[d], Y(l) && ~l.indexOf("random(") && (l = ft(l)), W(l + "") || l === "auto" || (l += ie.units[d] || W(ge(e, d)) || ""), (l + "").charAt(1) === "=" && (l = ge(e, d))) : l = ge(e, d), a = parseFloat(l), v = f === "string" && h.charAt(1) === "=" && h.substr(0, 2), v && (h = h.substr(2)), i = parseFloat(h), d in ce && (d === "autoAlpha" && (a === 1 && ge(e, "visibility") === "hidden" && i && (a = 0), S.push("visibility", 0, u.visibility), we(this, u, "visibility", a ? "inherit" : "hidden", i ? "inherit" : "hidden", !i)), d !== "scale" && d !== "transform" && (d = ce[d], ~d.indexOf(",") && (d = d.split(",")[0]))), y = d in ye, y) {
                        if (this.styles.save(d), T = h, f === "string" && h.substring(0, 6) === "var(--") {
                            if (h = ne(e, h.substring(4, h.indexOf(")"))), h.substring(0, 5) === "calc(") {
                                var k = e.style.perspective;
                                e.style.perspective = h, h = ne(e, "perspective"), k ? e.style.perspective = k : ke(e, "perspective")
                            }
                            i = parseFloat(h)
                        }
                        if (w || (x = e._gsap, x.renderTransform && !t.parseTransform || ct(e, t.parseTransform), b = t.smoothOrigin !== !1 && x.smooth, w = this._pt = new K(this._pt, u, B, 0, 1, x.renderTransform, x, 0, -1), w.dep = 1), d === "scale") this._pt = new K(this._pt, x, "scaleY", x.scaleY, (v ? Xe(x.scaleY, v + i) : i) - x.scaleY || 0, Qt), this._pt.u = 0, o.push("scaleY", d), d += "X";
                        else if (d === "transformOrigin") {
                            S.push(j, 0, u[j]), h = Qi(h), x.svg ? jt(e, h, 0, b, 0, this) : (g = parseFloat(h.split(" ")[2]) || 0, g !== x.zOrigin && we(this, x, "zOrigin", x.zOrigin, g), we(this, u, d, kt(l), kt(h)));
                            continue
                        } else if (d === "svgOrigin") {
                            jt(e, h, 1, b, 0, this);
                            continue
                        } else if (d in In) {
                            Ji(this, x, d, a, v ? Xe(a, v + h) : h);
                            continue
                        } else if (d === "smoothOrigin") {
                            we(this, x, "smooth", x.smooth, h);
                            continue
                        } else if (d === "force3D") {
                            x[d] = h;
                            continue
                        } else if (d === "transform") {
                            es(this, h, e);
                            continue
                        }
                    } else d in u || (d = Ke(d) || d);
                    if (y || (i || i === 0) && (a || a === 0) && !Fi.test(h) && d in u) m = (l + "").substr((a + "").length), i || (i = 0), g = W(h) || (d in ie.units ? ie.units[d] : m), m !== g && (a = Oe(e, d, l, g)), this._pt = new K(this._pt, y ? x : u, d, a, (v ? Xe(a, v + i) : i) - a, !y && (g === "px" || d === "zIndex") && t.autoRound !== !1 ? Vi : Qt), this._pt.u = g || 0, y && T !== h ? (this._pt.b = l, this._pt.e = T, this._pt.r = Bi) : m !== g && g !== "%" && (this._pt.b = l, this._pt.r = Li);
                    else if (d in u) $i.call(this, e, d, l, v ? v + h : h);
                    else if (d in e) this.add(e, d, l || e[d], v ? v + h : h, n, s);
                    else if (d !== "parseTransform") {
                        nr(d, h);
                        continue
                    }
                    y || (d in u ? S.push(d, 0, u[d]) : typeof e[d] == "function" ? S.push(d, 2, e[d]()) : S.push(d, 1, l || e[d])), o.push(d)
                }
            }
        A && bn(this)
    },
    render: function(e, t) {
        if (t.tween._time || !hr())
            for (var r = t._pt; r;) r.r(e, r.d), r = r._next;
        else t.styles.revert()
    },
    get: ge,
    aliases: ce,
    getSetter: function(e, t, r) {
        var n = ce[t];
        return n && n.indexOf(",") < 0 && (t = n), t in ye && t !== j && (e._gsap.x || ge(e, "x")) ? r && Pr === r ? t === "scale" ? Ni : zi : (Pr = r || {}) && (t === "scale" ? Xi : Yi) : e.style && !er(e.style[t]) ? Gi : ~t.indexOf("-") ? Hi : lr(e, t)
    },
    core: {
        _removeProperty: ke,
        _getMatrix: mr
    }
};
J.utils.checkPrefix = Ke;
J.core.getStyleSaver = Pn;
(function(c, e, t, r) {
    var n = Z(c + "," + e + "," + t, function(s) {
        ye[s] = 1
    });
    Z(e, function(s) {
        ie.units[s] = "deg", In[s] = 1
    }), ce[n[13]] = c + "," + e, Z(r, function(s) {
        var o = s.split(":");
        ce[o[1]] = n[o[0]]
    })
})("x,y,z,scale,scaleX,scaleY,xPercent,yPercent", "rotation,rotationX,rotationY,skewX,skewY", "transform,transformOrigin,svgOrigin,force3D,smoothOrigin,transformPerspective", "0:translateX,1:translateY,2:translateZ,8:rotate,8:rotationZ,8:rotateZ,9:rotateX,10:rotateY");
Z("x,y,z,top,right,bottom,left,width,height,fontSize,padding,margin,perspective", function(c) {
    ie.units[c] = "px"
});
J.registerPlugin(Rn);
var ts = J.registerPlugin(Rn) || J;
ts.core.Tween;
export {
    ts as a, rs as g, ns as h
};