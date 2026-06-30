import {
    r as g,
    b as Eo,
    j as H,
    y as Cl,
    R as y,
    a as Js,
    c as Tl,
    d as Zs
} from "./react-vendor-CJTAuEO4.js";
import {
    g as qt
} from "./media-vendor-B3vTC4Y3.js";
import {
    _ as wt,
    a as Et,
    b as Rl
} from "./network-vendor-D-EvXTlc.js";

function Xo(e, t) {
    if (typeof e == "function") return e(t);
    e != null && (e.current = t)
}

function $o(...e) {
    return t => {
        let n = !1;
        const r = e.map(o => {
            const i = Xo(o, t);
            return !n && typeof i == "function" && (n = !0), i
        });
        if (n) return () => {
            for (let o = 0; o < r.length; o++) {
                const i = r[o];
                typeof i == "function" ? i() : Xo(e[o], null)
            }
        }
    }
}

function ot(...e) {
    return g.useCallback($o(...e), e)
}
var Ol = Symbol.for("react.lazy"),
    Cn = Eo[" use ".trim().toString()];

function kl(e) {
    return typeof e == "object" && e !== null && "then" in e
}

function ea(e) {
    return e != null && typeof e == "object" && "$$typeof" in e && e.$$typeof === Ol && "_payload" in e && kl(e._payload)
}

function Il(e) {
    const t = Pl(e),
        n = g.forwardRef((r, o) => {
            let {
                children: i,
                ...s
            } = r;
            ea(i) && typeof Cn == "function" && (i = Cn(i._payload));
            const a = g.Children.toArray(i),
                c = a.find(Dl);
            if (c) {
                const l = c.props.children,
                    u = a.map(f => f === c ? g.Children.count(l) > 1 ? g.Children.only(null) : g.isValidElement(l) ? l.props.children : null : f);
                return H.jsx(t, { ...s,
                    ref: o,
                    children: g.isValidElement(l) ? g.cloneElement(l, void 0, u) : null
                })
            }
            return H.jsx(t, { ...s,
                ref: o,
                children: i
            })
        });
    return n.displayName = `${e}.Slot`, n
}

function Pl(e) {
    const t = g.forwardRef((n, r) => {
        let {
            children: o,
            ...i
        } = n;
        if (ea(o) && typeof Cn == "function" && (o = Cn(o._payload)), g.isValidElement(o)) {
            const s = jl(o),
                a = Ml(i, o.props);
            return o.type !== g.Fragment && (a.ref = r ? $o(r, s) : s), g.cloneElement(o, a)
        }
        return g.Children.count(o) > 1 ? g.Children.only(null) : null
    });
    return t.displayName = `${e}.SlotClone`, t
}
var Al = Symbol("radix.slottable");

function Dl(e) {
    return g.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === Al
}

function Ml(e, t) {
    const n = { ...t
    };
    for (const r in t) {
        const o = e[r],
            i = t[r];
        /^on[A-Z]/.test(r) ? o && i ? n[r] = (...a) => {
            const c = i(...a);
            return o(...a), c
        } : o && (n[r] = o) : r === "style" ? n[r] = { ...o,
            ...i
        } : r === "className" && (n[r] = [o, i].filter(Boolean).join(" "))
    }
    return { ...e,
        ...n
    }
}

function jl(e) {
    let t = Object.getOwnPropertyDescriptor(e.props, "ref") ?.get,
        n = t && "isReactWarning" in t && t.isReactWarning;
    return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref") ?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref)
}
var Ll = ["a", "button", "div", "form", "h2", "h3", "img", "input", "label", "li", "nav", "ol", "p", "select", "span", "svg", "ul"],
    Nl = Ll.reduce((e, t) => {
        const n = Il(`Primitive.${t}`),
            r = g.forwardRef((o, i) => {
                const {
                    asChild: s,
                    ...a
                } = o, c = s ? n : t;
                return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), H.jsx(c, { ...a,
                    ref: i
                })
            });
        return r.displayName = `Primitive.${t}`, { ...e,
            [t]: r
        }
    }, {}),
    qe = globalThis ?.document ? g.useLayoutEffect : () => {},
    Fl = "Portal",
    ta = g.forwardRef((e, t) => {
        const {
            container: n,
            ...r
        } = e, [o, i] = g.useState(!1);
        qe(() => i(!0), []);
        const s = n || o && globalThis ?.document ?.body;
        return s ? Cl.createPortal(H.jsx(Nl.div, { ...r,
            ref: t
        }), s) : null
    });
ta.displayName = Fl;
var zl = ta,
    Jo = Object.prototype.hasOwnProperty;

function zt(e, t) {
    var n, r;
    if (e === t) return !0;
    if (e && t && (n = e.constructor) === t.constructor) {
        if (n === Date) return e.getTime() === t.getTime();
        if (n === RegExp) return e.toString() === t.toString();
        if (n === Array) {
            if ((r = e.length) === t.length)
                for (; r-- && zt(e[r], t[r]););
            return r === -1
        }
        if (!n || typeof e == "object") {
            r = 0;
            for (n in e)
                if (Jo.call(e, n) && ++r && !Jo.call(t, n) || !(n in t) || !zt(e[n], t[n])) return !1;
            return Object.keys(t).length === r
        }
    }
    return e !== e && t !== t
}

function Hn(e, t) {
    if (Object.is(e, t)) return !0;
    if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
    const n = Object.keys(e);
    if (n.length !== Object.keys(t).length) return !1;
    for (let r = 0; r < n.length; r++)
        if (!Object.prototype.hasOwnProperty.call(t, n[r]) || !Object.is(e[n[r]], t[n[r]])) return !1;
    return !0
}
var Vn = function(t, n, r, o) {
    this.name = t, this.fn = n, this.args = r, this.modifiers = o
};
Vn.prototype._test = function(t) {
    var n = this.fn;
    try {
        gt(this.modifiers.slice(), n, this)(t)
    } catch {
        n = function() {
            return !1
        }
    }
    try {
        return gt(this.modifiers.slice(), n, this)(t)
    } catch {
        return !1
    }
};
Vn.prototype._check = function(t) {
    try {
        gt(this.modifiers.slice(), this.fn, this)(t)
    } catch {
        if (gt(this.modifiers.slice(), function(r) {
                return r
            }, this)(!1)) return
    }
    if (!gt(this.modifiers.slice(), this.fn, this)(t)) throw null
};
Vn.prototype._testAsync = function(t) {
    var n = this;
    return new Promise(function(r, o) {
        ra(n.modifiers.slice(), n.fn, n)(t).then(function(i) {
            i ? r(t) : o(null)
        }).catch(function(i) {
            return o(i)
        })
    })
};

function na(e, t) {
    return t === void 0 && (t = "simple"), typeof e == "object" ? e[t] : e
}

function gt(e, t, n) {
    if (e.length) {
        var r = e.shift(),
            o = gt(e, t, n);
        return r.perform(o, n)
    } else return na(t)
}

function ra(e, t, n) {
    if (e.length) {
        var r = e.shift(),
            o = ra(e, t, n);
        return r.performAsync(o, n)
    } else return function(i) {
        return Promise.resolve(na(t, "async")(i))
    }
}
var Wl = function(t, n, r) {
        this.name = t, this.perform = n, this.performAsync = r
    },
    So = (function(e) {
        function t(n, r, o, i) {
            for (var s = [], a = arguments.length - 4; a-- > 0;) s[a] = arguments[a + 4];
            e.call(this, s), e.captureStackTrace && e.captureStackTrace(this, t), this.rule = n, this.value = r, this.cause = o, this.target = i
        }
        return e && (t.__proto__ = e), t.prototype = Object.create(e && e.prototype), t.prototype.constructor = t, t
    })(Error),
    ke = function(t, n) {
        t === void 0 && (t = []), n === void 0 && (n = []), this.chain = t, this.nextRuleModifiers = n
    };
ke.prototype._applyRule = function(t, n) {
    var r = this;
    return function() {
        for (var o = [], i = arguments.length; i--;) o[i] = arguments[i];
        return r.chain.push(new Vn(n, t.apply(r, o), o, r.nextRuleModifiers)), r.nextRuleModifiers = [], r
    }
};
ke.prototype._applyModifier = function(t, n) {
    return this.nextRuleModifiers.push(new Wl(n, t.simple, t.async)), this
};
ke.prototype._clone = function() {
    return new ke(this.chain.slice(), this.nextRuleModifiers.slice())
};
ke.prototype.test = function(t) {
    return this.chain.every(function(n) {
        return n._test(t)
    })
};
ke.prototype.testAll = function(t) {
    var n = [];
    return this.chain.forEach(function(r) {
        try {
            r._check(t)
        } catch (o) {
            n.push(new So(r, t, o))
        }
    }), n
};
ke.prototype.check = function(t) {
    this.chain.forEach(function(n) {
        try {
            n._check(t)
        } catch (r) {
            throw new So(n, t, r)
        }
    })
};
ke.prototype.testAsync = function(t) {
    var n = this;
    return new Promise(function(r, o) {
        oa(t, n.chain.slice(), r, o)
    })
};

function oa(e, t, n, r) {
    if (t.length) {
        var o = t.shift();
        o._testAsync(e).then(function() {
            oa(e, t, n, r)
        }, function(i) {
            r(new So(o, e, i))
        })
    } else n(e)
}
var Zo = function(e, t) {
    return t && typeof e == "string" && e.trim().length === 0 ? !0 : e == null
};

function Bl(e, t) {
    return t === void 0 && (t = !1), {
        simple: function(n) {
            return Zo(n, t) || e.check(n) === void 0
        },
        async: function(n) {
            return Zo(n, t) || e.testAsync(n)
        }
    }
}

function fe() {
    return typeof Proxy < "u" ? ia(new ke) : Yr(new ke)
}
var Wt = {};
fe.extend = function(e) {
    Object.assign(Wt, e)
};
fe.clearCustomRules = function() {
    Wt = {}
};

function ia(e) {
    return new Proxy(e, {
        get: function(n, r) {
            if (r in n) return n[r];
            var o = ia(e._clone());
            if (r in Tn) return o._applyModifier(Tn[r], r);
            if (r in Wt) return o._applyRule(Wt[r], r);
            if (r in Qr) return o._applyRule(Qr[r], r)
        }
    })
}

function Yr(e) {
    var t = function(o, i) {
            return Object.keys(o).forEach(function(s) {
                i[s] = function() {
                    for (var a = [], c = arguments.length; c--;) a[c] = arguments[c];
                    var l = Yr(i._clone()),
                        u = l._applyRule(o[s], s).apply(void 0, a);
                    return u
                }
            }), i
        },
        n = t(Qr, e),
        r = t(Wt, n);
    return Object.keys(Tn).forEach(function(o) {
        Object.defineProperty(r, o, {
            get: function() {
                var i = Yr(r._clone());
                return i._applyModifier(Tn[o], o)
            }
        })
    }), r
}
var Tn = {
    not: {
        simple: function(e) {
            return function(t) {
                return !e(t)
            }
        },
        async: function(e) {
            return function(t) {
                return Promise.resolve(e(t)).then(function(n) {
                    return !n
                }).catch(function() {
                    return !0
                })
            }
        }
    },
    some: {
        simple: function(e) {
            return function(t) {
                return pn(t).some(function(n) {
                    try {
                        return e(n)
                    } catch {
                        return !1
                    }
                })
            }
        },
        async: function(e) {
            return function(t) {
                return Promise.all(pn(t).map(function(n) {
                    try {
                        return e(n).catch(function() {
                            return !1
                        })
                    } catch {
                        return !1
                    }
                })).then(function(n) {
                    return n.some(Boolean)
                })
            }
        }
    },
    every: {
        simple: function(e) {
            return function(t) {
                return t !== !1 && pn(t).every(e)
            }
        },
        async: function(e) {
            return function(t) {
                return Promise.all(pn(t).map(e)).then(function(n) {
                    return n.every(Boolean)
                })
            }
        }
    },
    strict: {
        simple: function(e, t) {
            return function(n) {
                return ei(t) && n && typeof n == "object" ? Object.keys(t.args[0]).length === Object.keys(n).length && e(n) : e(n)
            }
        },
        async: function(e, t) {
            return function(n) {
                return Promise.resolve(e(n)).then(function(r) {
                    return ei(t) && n && typeof n == "object" ? Object.keys(t.args[0]).length === Object.keys(n).length && r : r
                }).catch(function() {
                    return !1
                })
            }
        }
    }
};

function ei(e) {
    return e && e.name === "schema" && e.args.length > 0 && typeof e.args[0] == "object"
}

function pn(e) {
    return typeof e == "string" ? e.split("") : e
}
var Qr = {
    equal: function(e) {
        return function(t) {
            return t == e
        }
    },
    exact: function(e) {
        return function(t) {
            return t === e
        }
    },
    number: function(e) {
        return e === void 0 && (e = !0),
            function(t) {
                return typeof t == "number" && (e || isFinite(t))
            }
    },
    integer: function() {
        return function(e) {
            var t = Number.isInteger || Hl;
            return t(e)
        }
    },
    numeric: function() {
        return function(e) {
            return !isNaN(parseFloat(e)) && isFinite(e)
        }
    },
    string: function() {
        return ct("string")
    },
    boolean: function() {
        return ct("boolean")
    },
    undefined: function() {
        return ct("undefined")
    },
    null: function() {
        return ct("null")
    },
    array: function() {
        return ct("array")
    },
    object: function() {
        return ct("object")
    },
    instanceOf: function(e) {
        return function(t) {
            return t instanceof e
        }
    },
    pattern: function(e) {
        return function(t) {
            return e.test(t)
        }
    },
    lowercase: function() {
        return function(e) {
            return typeof e == "boolean" || e === e.toLowerCase() && e.trim() !== ""
        }
    },
    uppercase: function() {
        return function(e) {
            return e === e.toUpperCase() && e.trim() !== ""
        }
    },
    vowel: function() {
        return function(e) {
            return /^[aeiou]+$/i.test(e)
        }
    },
    consonant: function() {
        return function(e) {
            return /^(?=[^aeiou])([a-z]+)$/i.test(e)
        }
    },
    first: function(e) {
        return function(t) {
            return t[0] == e
        }
    },
    last: function(e) {
        return function(t) {
            return t[t.length - 1] == e
        }
    },
    empty: function() {
        return function(e) {
            return e.length === 0
        }
    },
    length: function(e, t) {
        return function(n) {
            return n.length >= e && n.length <= (t || e)
        }
    },
    minLength: function(e) {
        return function(t) {
            return t.length >= e
        }
    },
    maxLength: function(e) {
        return function(t) {
            return t.length <= e
        }
    },
    negative: function() {
        return function(e) {
            return e < 0
        }
    },
    positive: function() {
        return function(e) {
            return e >= 0
        }
    },
    between: function(e, t) {
        return function(n) {
            return n >= e && n <= t
        }
    },
    range: function(e, t) {
        return function(n) {
            return n >= e && n <= t
        }
    },
    lessThan: function(e) {
        return function(t) {
            return t < e
        }
    },
    lessThanOrEqual: function(e) {
        return function(t) {
            return t <= e
        }
    },
    greaterThan: function(e) {
        return function(t) {
            return t > e
        }
    },
    greaterThanOrEqual: function(e) {
        return function(t) {
            return t >= e
        }
    },
    even: function() {
        return function(e) {
            return e % 2 === 0
        }
    },
    odd: function() {
        return function(e) {
            return e % 2 !== 0
        }
    },
    includes: function(e) {
        return function(t) {
            return ~t.indexOf(e)
        }
    },
    schema: function(e) {
        return Vl(e)
    },
    passesAnyOf: function() {
        for (var e = [], t = arguments.length; t--;) e[t] = arguments[t];
        return function(n) {
            return e.some(function(r) {
                return r.test(n)
            })
        }
    },
    optional: Bl
};

function ct(e) {
    return function(t) {
        return Array.isArray(t) && e === "array" || t === null && e === "null" || typeof t === e
    }
}

function Hl(e) {
    return typeof e == "number" && isFinite(e) && Math.floor(e) === e
}

function Vl(e) {
    return {
        simple: function(t) {
            var n = [];
            if (Object.keys(e).forEach(function(r) {
                    var o = e[r];
                    try {
                        o.check((t || {})[r])
                    } catch (i) {
                        i.target = r, n.push(i)
                    }
                }), n.length > 0) throw n;
            return !0
        },
        async: function(t) {
            var n = [],
                r = Object.keys(e).map(function(o) {
                    var i = e[o];
                    return i.testAsync((t || {})[o]).catch(function(s) {
                        s.target = o, n.push(s)
                    })
                });
            return Promise.all(r).then(function() {
                if (n.length > 0) throw n;
                return !0
            })
        }
    }
}
var q = "colors",
    se = "sizes",
    D = "space",
    Ul = {
        gap: D,
        gridGap: D,
        columnGap: D,
        gridColumnGap: D,
        rowGap: D,
        gridRowGap: D,
        inset: D,
        insetBlock: D,
        insetBlockEnd: D,
        insetBlockStart: D,
        insetInline: D,
        insetInlineEnd: D,
        insetInlineStart: D,
        margin: D,
        marginTop: D,
        marginRight: D,
        marginBottom: D,
        marginLeft: D,
        marginBlock: D,
        marginBlockEnd: D,
        marginBlockStart: D,
        marginInline: D,
        marginInlineEnd: D,
        marginInlineStart: D,
        padding: D,
        paddingTop: D,
        paddingRight: D,
        paddingBottom: D,
        paddingLeft: D,
        paddingBlock: D,
        paddingBlockEnd: D,
        paddingBlockStart: D,
        paddingInline: D,
        paddingInlineEnd: D,
        paddingInlineStart: D,
        top: D,
        right: D,
        bottom: D,
        left: D,
        scrollMargin: D,
        scrollMarginTop: D,
        scrollMarginRight: D,
        scrollMarginBottom: D,
        scrollMarginLeft: D,
        scrollMarginX: D,
        scrollMarginY: D,
        scrollMarginBlock: D,
        scrollMarginBlockEnd: D,
        scrollMarginBlockStart: D,
        scrollMarginInline: D,
        scrollMarginInlineEnd: D,
        scrollMarginInlineStart: D,
        scrollPadding: D,
        scrollPaddingTop: D,
        scrollPaddingRight: D,
        scrollPaddingBottom: D,
        scrollPaddingLeft: D,
        scrollPaddingX: D,
        scrollPaddingY: D,
        scrollPaddingBlock: D,
        scrollPaddingBlockEnd: D,
        scrollPaddingBlockStart: D,
        scrollPaddingInline: D,
        scrollPaddingInlineEnd: D,
        scrollPaddingInlineStart: D,
        fontSize: "fontSizes",
        background: q,
        backgroundColor: q,
        backgroundImage: q,
        borderImage: q,
        border: q,
        borderBlock: q,
        borderBlockEnd: q,
        borderBlockStart: q,
        borderBottom: q,
        borderBottomColor: q,
        borderColor: q,
        borderInline: q,
        borderInlineEnd: q,
        borderInlineStart: q,
        borderLeft: q,
        borderLeftColor: q,
        borderRight: q,
        borderRightColor: q,
        borderTop: q,
        borderTopColor: q,
        caretColor: q,
        color: q,
        columnRuleColor: q,
        fill: q,
        outline: q,
        outlineColor: q,
        stroke: q,
        textDecorationColor: q,
        fontFamily: "fonts",
        fontWeight: "fontWeights",
        lineHeight: "lineHeights",
        letterSpacing: "letterSpacings",
        blockSize: se,
        minBlockSize: se,
        maxBlockSize: se,
        inlineSize: se,
        minInlineSize: se,
        maxInlineSize: se,
        width: se,
        minWidth: se,
        maxWidth: se,
        height: se,
        minHeight: se,
        maxHeight: se,
        flexBasis: se,
        gridTemplateColumns: se,
        gridTemplateRows: se,
        borderWidth: "borderWidths",
        borderTopWidth: "borderWidths",
        borderRightWidth: "borderWidths",
        borderBottomWidth: "borderWidths",
        borderLeftWidth: "borderWidths",
        borderStyle: "borderStyles",
        borderTopStyle: "borderStyles",
        borderRightStyle: "borderStyles",
        borderBottomStyle: "borderStyles",
        borderLeftStyle: "borderStyles",
        borderRadius: "radii",
        borderTopLeftRadius: "radii",
        borderTopRightRadius: "radii",
        borderBottomRightRadius: "radii",
        borderBottomLeftRadius: "radii",
        boxShadow: "shadows",
        textShadow: "shadows",
        transition: "transitions",
        zIndex: "zIndices"
    },
    ql = (e, t) => typeof t == "function" ? {
        "()": Function.prototype.toString.call(t)
    } : t,
    $t = () => {
        const e = Object.create(null);
        return (t, n, ...r) => {
            const o = (i => JSON.stringify(i, ql))(t);
            return o in e ? e[o] : e[o] = n(t, ...r)
        }
    },
    et = Symbol.for("sxs.internal"),
    Co = (e, t) => Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)),
    ti = e => {
        for (const t in e) return !0;
        return !1
    },
    {
        hasOwnProperty: Kl
    } = Object.prototype,
    Xr = e => e.includes("-") ? e : e.replace(/[A-Z]/g, (t => "-" + t.toLowerCase())),
    Gl = /\s+(?![^()]*\))/,
    lt = e => t => e(...typeof t == "string" ? String(t).split(Gl) : [t]),
    ni = {
        appearance: e => ({
            WebkitAppearance: e,
            appearance: e
        }),
        backfaceVisibility: e => ({
            WebkitBackfaceVisibility: e,
            backfaceVisibility: e
        }),
        backdropFilter: e => ({
            WebkitBackdropFilter: e,
            backdropFilter: e
        }),
        backgroundClip: e => ({
            WebkitBackgroundClip: e,
            backgroundClip: e
        }),
        boxDecorationBreak: e => ({
            WebkitBoxDecorationBreak: e,
            boxDecorationBreak: e
        }),
        clipPath: e => ({
            WebkitClipPath: e,
            clipPath: e
        }),
        content: e => ({
            content: e.includes('"') || e.includes("'") || /^([A-Za-z]+\([^]*|[^]*-quote|inherit|initial|none|normal|revert|unset)$/.test(e) ? e : `"${e}"`
        }),
        hyphens: e => ({
            WebkitHyphens: e,
            hyphens: e
        }),
        maskImage: e => ({
            WebkitMaskImage: e,
            maskImage: e
        }),
        maskSize: e => ({
            WebkitMaskSize: e,
            maskSize: e
        }),
        tabSize: e => ({
            MozTabSize: e,
            tabSize: e
        }),
        textSizeAdjust: e => ({
            WebkitTextSizeAdjust: e,
            textSizeAdjust: e
        }),
        userSelect: e => ({
            WebkitUserSelect: e,
            userSelect: e
        }),
        marginBlock: lt(((e, t) => ({
            marginBlockStart: e,
            marginBlockEnd: t || e
        }))),
        marginInline: lt(((e, t) => ({
            marginInlineStart: e,
            marginInlineEnd: t || e
        }))),
        maxSize: lt(((e, t) => ({
            maxBlockSize: e,
            maxInlineSize: t || e
        }))),
        minSize: lt(((e, t) => ({
            minBlockSize: e,
            minInlineSize: t || e
        }))),
        paddingBlock: lt(((e, t) => ({
            paddingBlockStart: e,
            paddingBlockEnd: t || e
        }))),
        paddingInline: lt(((e, t) => ({
            paddingInlineStart: e,
            paddingInlineEnd: t || e
        })))
    },
    dr = /([\d.]+)([^]*)/,
    Yl = (e, t) => e.length ? e.reduce(((n, r) => (n.push(...t.map((o => o.includes("&") ? o.replace(/&/g, /[ +>|~]/.test(r) && /&.*&/.test(o) ? `:is(${r})` : r) : r + " " + o))), n)), []) : t,
    Ql = (e, t) => e in Xl && typeof t == "string" ? t.replace(/^((?:[^]*[^\w-])?)(fit-content|stretch)((?:[^\w-][^]*)?)$/, ((n, r, o, i) => r + (o === "stretch" ? `-moz-available${i};${Xr(e)}:${r}-webkit-fill-available` : `-moz-fit-content${i};${Xr(e)}:${r}fit-content`) + i)) : String(t),
    Xl = {
        blockSize: 1,
        height: 1,
        inlineSize: 1,
        maxBlockSize: 1,
        maxHeight: 1,
        maxInlineSize: 1,
        maxWidth: 1,
        minBlockSize: 1,
        minHeight: 1,
        minInlineSize: 1,
        minWidth: 1,
        width: 1
    },
    Fe = e => e ? e + "-" : "",
    sa = (e, t, n) => e.replace(/([+-])?((?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?)?(\$|--)([$\w-]+)/g, ((r, o, i, s, a) => s == "$" == !!i ? r : (o || s == "--" ? "calc(" : "") + "var(--" + (s === "$" ? Fe(t) + (a.includes("$") ? "" : Fe(n)) + a.replace(/\$/g, "-") : a) + ")" + (o || s == "--" ? "*" + (o || "") + (i || "1") + ")" : ""))),
    Jl = /\s*,\s*(?![^()]*\))/,
    Zl = Object.prototype.toString,
    pt = (e, t, n, r, o) => {
        let i, s, a;
        const c = (l, u, f) => {
            let d, h;
            const p = m => {
                for (d in m) {
                    const _ = d.charCodeAt(0) === 64,
                        x = _ && Array.isArray(m[d]) ? m[d] : [m[d]];
                    for (h of x) {
                        const w = /[A-Z]/.test(b = d) ? b : b.replace(/-[^]/g, (E => E[1].toUpperCase())),
                            C = typeof h == "object" && h && h.toString === Zl && (!r.utils[w] || !u.length);
                        if (w in r.utils && !C) {
                            const E = r.utils[w];
                            if (E !== s) {
                                s = E, p(E(h)), s = null;
                                continue
                            }
                        } else if (w in ni) {
                            const E = ni[w];
                            if (E !== a) {
                                a = E, p(E(h)), a = null;
                                continue
                            }
                        }
                        if (_ && (v = d.slice(1) in r.media ? "@media " + r.media[d.slice(1)] : d, d = v.replace(/\(\s*([\w-]+)\s*(=|<|<=|>|>=)\s*([\w-]+)\s*(?:(<|<=|>|>=)\s*([\w-]+)\s*)?\)/g, ((E, S, R, j, T, O) => {
                                const k = dr.test(S),
                                    A = .0625 * (k ? -1 : 1),
                                    [M, N] = k ? [j, S] : [S, j];
                                return "(" + (R[0] === "=" ? "" : R[0] === ">" === k ? "max-" : "min-") + M + ":" + (R[0] !== "=" && R.length === 1 ? N.replace(dr, ((W, V, I) => Number(V) + A * (R === ">" ? 1 : -1) + I)) : N) + (T ? ") and (" + (T[0] === ">" ? "min-" : "max-") + M + ":" + (T.length === 1 ? O.replace(dr, ((W, V, I) => Number(V) + A * (T === ">" ? -1 : 1) + I)) : O) : "") + ")"
                            }))), C) {
                            const E = _ ? f.concat(d) : [...f],
                                S = _ ? [...u] : Yl(u, d.split(Jl));
                            i !== void 0 && o(ri(...i)), i = void 0, c(h, S, E)
                        } else i === void 0 && (i = [
                            [], u, f
                        ]), d = _ || d.charCodeAt(0) !== 36 ? d : `--${Fe(r.prefix)}${d.slice(1).replace(/\$/g,"-")}`, h = C ? h : typeof h == "number" ? h && w in eu ? String(h) + "px" : String(h) : sa(Ql(w, h ?? ""), r.prefix, r.themeMap[w]), i[0].push(`${_?`${d} `:`${Xr(d)}:`}${h}`)
                    }
                }
                var v, b
            };
            p(l), i !== void 0 && o(ri(...i)), i = void 0
        };
        c(e, t, n)
    },
    ri = (e, t, n) => `${n.map((r=>`${r}{`)).join("")}${t.length?`${t.join(",")}{`:""}${e.join(";")}${t.length?"}":""}${Array(n.length?n.length+1:0).join("}")}`,
    eu = {
        animationDelay: 1,
        animationDuration: 1,
        backgroundSize: 1,
        blockSize: 1,
        border: 1,
        borderBlock: 1,
        borderBlockEnd: 1,
        borderBlockEndWidth: 1,
        borderBlockStart: 1,
        borderBlockStartWidth: 1,
        borderBlockWidth: 1,
        borderBottom: 1,
        borderBottomLeftRadius: 1,
        borderBottomRightRadius: 1,
        borderBottomWidth: 1,
        borderEndEndRadius: 1,
        borderEndStartRadius: 1,
        borderInlineEnd: 1,
        borderInlineEndWidth: 1,
        borderInlineStart: 1,
        borderInlineStartWidth: 1,
        borderInlineWidth: 1,
        borderLeft: 1,
        borderLeftWidth: 1,
        borderRadius: 1,
        borderRight: 1,
        borderRightWidth: 1,
        borderSpacing: 1,
        borderStartEndRadius: 1,
        borderStartStartRadius: 1,
        borderTop: 1,
        borderTopLeftRadius: 1,
        borderTopRightRadius: 1,
        borderTopWidth: 1,
        borderWidth: 1,
        bottom: 1,
        columnGap: 1,
        columnRule: 1,
        columnRuleWidth: 1,
        columnWidth: 1,
        containIntrinsicSize: 1,
        flexBasis: 1,
        fontSize: 1,
        gap: 1,
        gridAutoColumns: 1,
        gridAutoRows: 1,
        gridTemplateColumns: 1,
        gridTemplateRows: 1,
        height: 1,
        inlineSize: 1,
        inset: 1,
        insetBlock: 1,
        insetBlockEnd: 1,
        insetBlockStart: 1,
        insetInline: 1,
        insetInlineEnd: 1,
        insetInlineStart: 1,
        left: 1,
        letterSpacing: 1,
        margin: 1,
        marginBlock: 1,
        marginBlockEnd: 1,
        marginBlockStart: 1,
        marginBottom: 1,
        marginInline: 1,
        marginInlineEnd: 1,
        marginInlineStart: 1,
        marginLeft: 1,
        marginRight: 1,
        marginTop: 1,
        maxBlockSize: 1,
        maxHeight: 1,
        maxInlineSize: 1,
        maxWidth: 1,
        minBlockSize: 1,
        minHeight: 1,
        minInlineSize: 1,
        minWidth: 1,
        offsetDistance: 1,
        offsetRotate: 1,
        outline: 1,
        outlineOffset: 1,
        outlineWidth: 1,
        overflowClipMargin: 1,
        padding: 1,
        paddingBlock: 1,
        paddingBlockEnd: 1,
        paddingBlockStart: 1,
        paddingBottom: 1,
        paddingInline: 1,
        paddingInlineEnd: 1,
        paddingInlineStart: 1,
        paddingLeft: 1,
        paddingRight: 1,
        paddingTop: 1,
        perspective: 1,
        right: 1,
        rowGap: 1,
        scrollMargin: 1,
        scrollMarginBlock: 1,
        scrollMarginBlockEnd: 1,
        scrollMarginBlockStart: 1,
        scrollMarginBottom: 1,
        scrollMarginInline: 1,
        scrollMarginInlineEnd: 1,
        scrollMarginInlineStart: 1,
        scrollMarginLeft: 1,
        scrollMarginRight: 1,
        scrollMarginTop: 1,
        scrollPadding: 1,
        scrollPaddingBlock: 1,
        scrollPaddingBlockEnd: 1,
        scrollPaddingBlockStart: 1,
        scrollPaddingBottom: 1,
        scrollPaddingInline: 1,
        scrollPaddingInlineEnd: 1,
        scrollPaddingInlineStart: 1,
        scrollPaddingLeft: 1,
        scrollPaddingRight: 1,
        scrollPaddingTop: 1,
        shapeMargin: 1,
        textDecoration: 1,
        textDecorationThickness: 1,
        textIndent: 1,
        textUnderlineOffset: 1,
        top: 1,
        transitionDelay: 1,
        transitionDuration: 1,
        verticalAlign: 1,
        width: 1,
        wordSpacing: 1
    },
    oi = e => String.fromCharCode(e + (e > 25 ? 39 : 97)),
    tt = e => (t => {
        let n, r = "";
        for (n = Math.abs(t); n > 52; n = n / 52 | 0) r = oi(n % 52) + r;
        return oi(n % 52) + r
    })(((t, n) => {
        let r = n.length;
        for (; r;) t = 33 * t ^ n.charCodeAt(--r);
        return t
    })(5381, JSON.stringify(e)) >>> 0),
    At = ["themed", "global", "styled", "onevar", "resonevar", "allvar", "inline"],
    tu = e => {
        if (e.href && !e.href.startsWith(location.origin)) return !1;
        try {
            return !!e.cssRules
        } catch {
            return !1
        }
    },
    nu = e => {
        let t;
        const n = () => {
                const {
                    cssRules: o
                } = t.sheet;
                return [].map.call(o, ((i, s) => {
                    const {
                        cssText: a
                    } = i;
                    let c = "";
                    if (a.startsWith("--sxs")) return "";
                    if (o[s - 1] && (c = o[s - 1].cssText).startsWith("--sxs")) {
                        if (!i.cssRules.length) return "";
                        for (const l in t.rules)
                            if (t.rules[l].group === i) return `--sxs{--sxs:${[...t.rules[l].cache].join(" ")}}${a}`;
                        return i.cssRules.length ? `${c}${a}` : ""
                    }
                    return a
                })).join("")
            },
            r = () => {
                if (t) {
                    const {
                        rules: a,
                        sheet: c
                    } = t;
                    if (!c.deleteRule) {
                        for (; Object(Object(c.cssRules)[0]).type === 3;) c.cssRules.splice(0, 1);
                        c.cssRules = []
                    }
                    for (const l in a) delete a[l]
                }
                const o = Object(e).styleSheets || [];
                for (const a of o)
                    if (tu(a)) {
                        for (let c = 0, l = a.cssRules; l[c]; ++c) {
                            const u = Object(l[c]);
                            if (u.type !== 1) continue;
                            const f = Object(l[c + 1]);
                            if (f.type !== 4) continue;
                            ++c;
                            const {
                                cssText: d
                            } = u;
                            if (!d.startsWith("--sxs")) continue;
                            const h = d.slice(14, -3).trim().split(/\s+/),
                                p = At[h[0]];
                            p && (t || (t = {
                                sheet: a,
                                reset: r,
                                rules: {},
                                toString: n
                            }), t.rules[p] = {
                                group: f,
                                index: c,
                                cache: new Set(h)
                            })
                        }
                        if (t) break
                    }
                if (!t) {
                    const a = (c, l) => ({
                        type: l,
                        cssRules: [],
                        insertRule(u, f) {
                            this.cssRules.splice(f, 0, a(u, {
                                import: 3,
                                undefined: 1
                            }[(u.toLowerCase().match(/^@([a-z]+)/) || [])[1]] || 4))
                        },
                        get cssText() {
                            return c === "@media{}" ? `@media{${[].map.call(this.cssRules,(u=>u.cssText)).join("")}}` : c
                        }
                    });
                    t = {
                        sheet: e ? (e.head || e).appendChild(document.createElement("style")).sheet : a("", "text/css"),
                        rules: {},
                        reset: r,
                        toString: n
                    }
                }
                const {
                    sheet: i,
                    rules: s
                } = t;
                for (let a = At.length - 1; a >= 0; --a) {
                    const c = At[a];
                    if (!s[c]) {
                        const l = At[a + 1],
                            u = s[l] ? s[l].index : i.cssRules.length;
                        i.insertRule("@media{}", u), i.insertRule(`--sxs{--sxs:${a}}`, u), s[c] = {
                            group: i.cssRules[u + 1],
                            index: u,
                            cache: new Set([a])
                        }
                    }
                    ru(s[c])
                }
            };
        return r(), t
    },
    ru = e => {
        const t = e.group;
        let n = t.cssRules.length;
        e.apply = r => {
            try {
                t.insertRule(r, n), ++n
            } catch {}
        }
    },
    Ot = Symbol(),
    ou = $t(),
    ii = (e, t) => ou(e, (() => (...n) => {
        let r = {
            type: null,
            composers: new Set
        };
        for (const o of n)
            if (o != null)
                if (o[et]) {
                    r.type == null && (r.type = o[et].type);
                    for (const i of o[et].composers) r.composers.add(i)
                } else o.constructor !== Object || o.$$typeof ? r.type == null && (r.type = o) : r.composers.add(iu(o, e));
        return r.type == null && (r.type = "span"), r.composers.size || r.composers.add(["PJLV", {},
            [],
            [], {},
            []
        ]), su(e, r, t)
    })),
    iu = ({
        variants: e,
        compoundVariants: t,
        defaultVariants: n,
        ...r
    }, o) => {
        const i = `${Fe(o.prefix)}c-${tt(r)}`,
            s = [],
            a = [],
            c = Object.create(null),
            l = [];
        for (const d in n) c[d] = String(n[d]);
        if (typeof e == "object" && e)
            for (const d in e) {
                u = c, f = d, Kl.call(u, f) || (c[d] = "undefined");
                const h = e[d];
                for (const p in h) {
                    const m = {
                        [d]: String(p)
                    };
                    String(p) === "undefined" && l.push(d);
                    const v = h[p],
                        b = [m, v, !ti(v)];
                    s.push(b)
                }
            }
        var u, f;
        if (typeof t == "object" && t)
            for (const d of t) {
                let {
                    css: h,
                    ...p
                } = d;
                h = typeof h == "object" && h || {};
                for (const v in p) p[v] = String(p[v]);
                const m = [p, h, !ti(h)];
                a.push(m)
            }
        return [i, r, s, a, c, l]
    },
    su = (e, t, n) => {
        const [r, o, i, s] = au(t.composers), a = typeof t.type == "function" || t.type.$$typeof ? (f => {
            function d() {
                for (let h = 0; h < d[Ot].length; h++) {
                    const [p, m] = d[Ot][h];
                    f.rules[p].apply(m)
                }
                return d[Ot] = [], null
            }
            return d[Ot] = [], d.rules = {}, At.forEach((h => d.rules[h] = {
                apply: p => d[Ot].push([h, p])
            })), d
        })(n) : null, c = (a || n).rules, l = `.${r}${o.length>1?`:where(.${o.slice(1).join(".")})`:""}`, u = f => {
            f = typeof f == "object" && f || cu;
            const {
                css: d,
                ...h
            } = f, p = {};
            for (const b in i)
                if (delete h[b], b in f) {
                    let _ = f[b];
                    typeof _ == "object" && _ ? p[b] = {
                        "@initial": i[b],
                        ..._
                    } : (_ = String(_), p[b] = _ !== "undefined" || s.has(b) ? _ : i[b])
                } else p[b] = i[b];
            const m = new Set([...o]);
            for (const [b, _, x, w] of t.composers) {
                n.rules.styled.cache.has(b) || (n.rules.styled.cache.add(b), pt(_, [`.${b}`], [], e, (S => {
                    c.styled.apply(S)
                })));
                const C = si(x, p, e.media),
                    E = si(w, p, e.media, !0);
                for (const S of C)
                    if (S !== void 0)
                        for (const [R, j, T] of S) {
                            const O = `${b}-${tt(j)}-${R}`;
                            m.add(O);
                            const k = (T ? n.rules.resonevar : n.rules.onevar).cache,
                                A = T ? c.resonevar : c.onevar;
                            k.has(O) || (k.add(O), pt(j, [`.${O}`], [], e, (M => {
                                A.apply(M)
                            })))
                        }
                for (const S of E)
                    if (S !== void 0)
                        for (const [R, j] of S) {
                            const T = `${b}-${tt(j)}-${R}`;
                            m.add(T), n.rules.allvar.cache.has(T) || (n.rules.allvar.cache.add(T), pt(j, [`.${T}`], [], e, (O => {
                                c.allvar.apply(O)
                            })))
                        }
            }
            if (typeof d == "object" && d) {
                const b = `${r}-i${tt(d)}-css`;
                m.add(b), n.rules.inline.cache.has(b) || (n.rules.inline.cache.add(b), pt(d, [`.${b}`], [], e, (_ => {
                    c.inline.apply(_)
                })))
            }
            for (const b of String(f.className || "").trim().split(/\s+/)) b && m.add(b);
            const v = h.className = [...m].join(" ");
            return {
                type: t.type,
                className: v,
                selector: l,
                props: h,
                toString: () => v,
                deferredInjector: a
            }
        };
        return Co(u, {
            className: r,
            selector: l,
            [et]: t,
            toString: () => (n.rules.styled.cache.has(r) || u(), r)
        })
    },
    au = e => {
        let t = "";
        const n = [],
            r = {},
            o = [];
        for (const [i, , , , s, a] of e) {
            t === "" && (t = i), n.push(i), o.push(...a);
            for (const c in s) {
                const l = s[c];
                (r[c] === void 0 || l !== "undefined" || a.includes(l)) && (r[c] = l)
            }
        }
        return [t, n, r, new Set(o)]
    },
    si = (e, t, n, r) => {
        const o = [];
        e: for (let [i, s, a] of e) {
            if (a) continue;
            let c, l = 0,
                u = !1;
            for (c in i) {
                const f = i[c];
                let d = t[c];
                if (d !== f) {
                    if (typeof d != "object" || !d) continue e; {
                        let h, p, m = 0;
                        for (const v in d) {
                            if (f === String(d[v])) {
                                if (v !== "@initial") {
                                    const b = v.slice(1);
                                    (p = p || []).push(b in n ? n[b] : v.replace(/^@media ?/, "")), u = !0
                                }
                                l += m, h = !0
                            }++m
                        }
                        if (p && p.length && (s = {
                                ["@media " + p.join(", ")]: s
                            }), !h) continue e
                    }
                }
            }(o[l] = o[l] || []).push([r ? "cv" : `${c}-${i[c]}`, s, u])
        }
        return o
    },
    cu = {},
    lu = $t(),
    uu = (e, t) => lu(e, (() => (...n) => {
        const r = () => {
            for (let o of n) {
                o = typeof o == "object" && o || {};
                let i = tt(o);
                if (!t.rules.global.cache.has(i)) {
                    if (t.rules.global.cache.add(i), "@import" in o) {
                        let s = [].indexOf.call(t.sheet.cssRules, t.rules.themed.group) - 1;
                        for (let a of [].concat(o["@import"])) a = a.includes('"') || a.includes("'") ? a : `"${a}"`, t.sheet.insertRule(`@import ${a};`, s++);
                        delete o["@import"]
                    }
                    pt(o, [], [], e, (s => {
                        t.rules.global.apply(s)
                    }))
                }
            }
            return ""
        };
        return Co(r, {
            toString: r
        })
    })),
    fu = $t(),
    du = (e, t) => fu(e, (() => n => {
        const r = `${Fe(e.prefix)}k-${tt(n)}`,
            o = () => {
                if (!t.rules.global.cache.has(r)) {
                    t.rules.global.cache.add(r);
                    const i = [];
                    pt(n, [], [], e, (a => i.push(a)));
                    const s = `@keyframes ${r}{${i.join("")}}`;
                    t.rules.global.apply(s)
                }
                return r
            };
        return Co(o, {
            get name() {
                return o()
            },
            toString: o
        })
    })),
    hu = class {
        constructor(e, t, n, r) {
            this.token = e == null ? "" : String(e), this.value = t == null ? "" : String(t), this.scale = n == null ? "" : String(n), this.prefix = r == null ? "" : String(r)
        }
        get computedValue() {
            return "var(" + this.variable + ")"
        }
        get variable() {
            return "--" + Fe(this.prefix) + Fe(this.scale) + this.token
        }
        toString() {
            return this.computedValue
        }
    },
    pu = $t(),
    gu = (e, t) => pu(e, (() => (n, r) => {
        r = typeof n == "object" && n || Object(r);
        const o = `.${n=(n=typeof n=="string"?n:"")||`${Fe(e.prefix)}t-${tt(r)}`}`,
            i = {},
            s = [];
        for (const c in r) {
            i[c] = {};
            for (const l in r[c]) {
                const u = `--${Fe(e.prefix)}${c}-${l}`,
                    f = sa(String(r[c][l]), e.prefix, c);
                i[c][l] = new hu(l, f, c, e.prefix), s.push(`${u}:${f}`)
            }
        }
        const a = () => {
            if (s.length && !t.rules.themed.cache.has(n)) {
                t.rules.themed.cache.add(n);
                const c = `${r===e.theme?":root,":""}.${n}{${s.join(";")}}`;
                t.rules.themed.apply(c)
            }
            return n
        };
        return { ...i,
            get className() {
                return a()
            },
            selector: o,
            toString: a
        }
    })),
    mu = $t(),
    vu = $t(),
    bu = e => {
        const t = (n => {
            let r = !1;
            const o = mu(n, (i => {
                r = !0;
                const s = "prefix" in (i = typeof i == "object" && i || {}) ? String(i.prefix) : "",
                    a = typeof i.media == "object" && i.media || {},
                    c = typeof i.root == "object" ? i.root || null : globalThis.document || null,
                    l = typeof i.theme == "object" && i.theme || {},
                    u = {
                        prefix: s,
                        media: a,
                        theme: l,
                        themeMap: typeof i.themeMap == "object" && i.themeMap || { ...Ul
                        },
                        utils: typeof i.utils == "object" && i.utils || {}
                    },
                    f = nu(c),
                    d = {
                        css: ii(u, f),
                        globalCss: uu(u, f),
                        keyframes: du(u, f),
                        createTheme: gu(u, f),
                        reset() {
                            f.reset(), d.theme.toString()
                        },
                        theme: {},
                        sheet: f,
                        config: u,
                        prefix: s,
                        getCssText: f.toString,
                        toString: f.toString
                    };
                return String(d.theme = d.createTheme(l)), d
            }));
            return r || o.reset(), o
        })(e);
        return t.styled = (({
            config: n,
            sheet: r
        }) => vu(n, (() => {
            const o = ii(n, r);
            return (...i) => {
                const s = o(...i),
                    a = s[et].type,
                    c = y.forwardRef(((l, u) => {
                        const f = l && l.as || a,
                            {
                                props: d,
                                deferredInjector: h
                            } = s(l);
                        return delete d.as, d.ref = u, h ? y.createElement(y.Fragment, null, y.createElement(f, d), y.createElement(h, null)) : y.createElement(f, d)
                    }));
                return c.className = s.className, c.displayName = `Styled.${a.displayName||a.name||a}`, c.selector = s.selector, c.toString = () => s.selector, c[et] = s[et], c
            }
        })))(t), t
    };

function yu(e, t, n) {
    return Math.max(t, Math.min(e, n))
}
const Y = {
    toVector(e, t) {
        return e === void 0 && (e = t), Array.isArray(e) ? e : [e, e]
    },
    add(e, t) {
        return [e[0] + t[0], e[1] + t[1]]
    },
    sub(e, t) {
        return [e[0] - t[0], e[1] - t[1]]
    },
    addTo(e, t) {
        e[0] += t[0], e[1] += t[1]
    },
    subTo(e, t) {
        e[0] -= t[0], e[1] -= t[1]
    }
};

function ai(e, t, n) {
    return t === 0 || Math.abs(t) === 1 / 0 ? Math.pow(e, n * 5) : e * t * n / (t + n * e)
}

function ci(e, t, n, r = .15) {
    return r === 0 ? yu(e, t, n) : e < t ? -ai(t - e, n - t, r) + t : e > n ? +ai(e - n, n - t, r) + n : e
}

function _u(e, [t, n], [r, o]) {
    const [
        [i, s],
        [a, c]
    ] = e;
    return [ci(t, i, s, r), ci(n, a, c, o)]
}

function xu(e, t) {
    if (typeof e != "object" || e === null) return e;
    var n = e[Symbol.toPrimitive];
    if (n !== void 0) {
        var r = n.call(e, t);
        if (typeof r != "object") return r;
        throw new TypeError("@@toPrimitive must return a primitive value.")
    }
    return (t === "string" ? String : Number)(e)
}

function wu(e) {
    var t = xu(e, "string");
    return typeof t == "symbol" ? t : String(t)
}

function ee(e, t, n) {
    return t = wu(t), t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function li(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var r = Object.getOwnPropertySymbols(e);
        t && (r = r.filter(function(o) {
            return Object.getOwnPropertyDescriptor(e, o).enumerable
        })), n.push.apply(n, r)
    }
    return n
}

function X(e) {
    for (var t = 1; t < arguments.length; t++) {
        var n = arguments[t] != null ? arguments[t] : {};
        t % 2 ? li(Object(n), !0).forEach(function(r) {
            ee(e, r, n[r])
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : li(Object(n)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r))
        })
    }
    return e
}
const aa = {
    pointer: {
        start: "down",
        change: "move",
        end: "up"
    },
    mouse: {
        start: "down",
        change: "move",
        end: "up"
    },
    touch: {
        start: "start",
        change: "move",
        end: "end"
    },
    gesture: {
        start: "start",
        change: "change",
        end: "end"
    }
};

function ui(e) {
    return e ? e[0].toUpperCase() + e.slice(1) : ""
}
const Eu = ["enter", "leave"];

function $u(e = !1, t) {
    return e && !Eu.includes(t)
}

function Su(e, t = "", n = !1) {
    const r = aa[e],
        o = r && r[t] || t;
    return "on" + ui(e) + ui(o) + ($u(n, o) ? "Capture" : "")
}
const Cu = ["gotpointercapture", "lostpointercapture"];

function Tu(e) {
    let t = e.substring(2).toLowerCase();
    const n = !!~t.indexOf("passive");
    n && (t = t.replace("passive", ""));
    const r = Cu.includes(t) ? "capturecapture" : "capture",
        o = !!~t.indexOf(r);
    return o && (t = t.replace("capture", "")), {
        device: t,
        capture: o,
        passive: n
    }
}

function Ru(e, t = "") {
    const n = aa[e],
        r = n && n[t] || t;
    return e + r
}

function Un(e) {
    return "touches" in e
}

function ca(e) {
    return Un(e) ? "touch" : "pointerType" in e ? e.pointerType : "mouse"
}

function Ou(e) {
    return Array.from(e.touches).filter(t => {
        var n, r;
        return t.target === e.currentTarget || ((n = e.currentTarget) === null || n === void 0 || (r = n.contains) === null || r === void 0 ? void 0 : r.call(n, t.target))
    })
}

function ku(e) {
    return e.type === "touchend" || e.type === "touchcancel" ? e.changedTouches : e.targetTouches
}

function la(e) {
    return Un(e) ? ku(e)[0] : e
}

function Jr(e, t) {
    try {
        const n = t.clientX - e.clientX,
            r = t.clientY - e.clientY,
            o = (t.clientX + e.clientX) / 2,
            i = (t.clientY + e.clientY) / 2,
            s = Math.hypot(n, r);
        return {
            angle: -(Math.atan2(n, r) * 180) / Math.PI,
            distance: s,
            origin: [o, i]
        }
    } catch {}
    return null
}

function Iu(e) {
    return Ou(e).map(t => t.identifier)
}

function fi(e, t) {
    const [n, r] = Array.from(e.touches).filter(o => t.includes(o.identifier));
    return Jr(n, r)
}

function hr(e) {
    const t = la(e);
    return Un(e) ? t.identifier : t.pointerId
}

function bt(e) {
    const t = la(e);
    return [t.clientX, t.clientY]
}
const di = 40,
    hi = 800;

function ua(e) {
    let {
        deltaX: t,
        deltaY: n,
        deltaMode: r
    } = e;
    return r === 1 ? (t *= di, n *= di) : r === 2 && (t *= hi, n *= hi), [t, n]
}

function Pu(e) {
    var t, n;
    const {
        scrollX: r,
        scrollY: o,
        scrollLeft: i,
        scrollTop: s
    } = e.currentTarget;
    return [(t = r ?? i) !== null && t !== void 0 ? t : 0, (n = o ?? s) !== null && n !== void 0 ? n : 0]
}

function Au(e) {
    const t = {};
    if ("buttons" in e && (t.buttons = e.buttons), "shiftKey" in e) {
        const {
            shiftKey: n,
            altKey: r,
            metaKey: o,
            ctrlKey: i
        } = e;
        Object.assign(t, {
            shiftKey: n,
            altKey: r,
            metaKey: o,
            ctrlKey: i
        })
    }
    return t
}

function Rn(e, ...t) {
    return typeof e == "function" ? e(...t) : e
}

function Du() {}

function Mu(...e) {
    return e.length === 0 ? Du : e.length === 1 ? e[0] : function() {
        let t;
        for (const n of e) t = n.apply(this, arguments) || t;
        return t
    }
}

function pi(e, t) {
    return Object.assign({}, t, e || {})
}
const ju = 32;
class fa {
    constructor(t, n, r) {
        this.ctrl = t, this.args = n, this.key = r, this.state || (this.state = {}, this.computeValues([0, 0]), this.computeInitial(), this.init && this.init(), this.reset())
    }
    get state() {
        return this.ctrl.state[this.key]
    }
    set state(t) {
        this.ctrl.state[this.key] = t
    }
    get shared() {
        return this.ctrl.state.shared
    }
    get eventStore() {
        return this.ctrl.gestureEventStores[this.key]
    }
    get timeoutStore() {
        return this.ctrl.gestureTimeoutStores[this.key]
    }
    get config() {
        return this.ctrl.config[this.key]
    }
    get sharedConfig() {
        return this.ctrl.config.shared
    }
    get handler() {
        return this.ctrl.handlers[this.key]
    }
    reset() {
        const {
            state: t,
            shared: n,
            ingKey: r,
            args: o
        } = this;
        n[r] = t._active = t.active = t._blocked = t._force = !1, t._step = [!1, !1], t.intentional = !1, t._movement = [0, 0], t._distance = [0, 0], t._direction = [0, 0], t._delta = [0, 0], t._bounds = [
            [-1 / 0, 1 / 0],
            [-1 / 0, 1 / 0]
        ], t.args = o, t.axis = void 0, t.memo = void 0, t.elapsedTime = t.timeDelta = 0, t.direction = [0, 0], t.distance = [0, 0], t.overflow = [0, 0], t._movementBound = [!1, !1], t.velocity = [0, 0], t.movement = [0, 0], t.delta = [0, 0], t.timeStamp = 0
    }
    start(t) {
        const n = this.state,
            r = this.config;
        n._active || (this.reset(), this.computeInitial(), n._active = !0, n.target = t.target, n.currentTarget = t.currentTarget, n.lastOffset = r.from ? Rn(r.from, n) : n.offset, n.offset = n.lastOffset, n.startTime = n.timeStamp = t.timeStamp)
    }
    computeValues(t) {
        const n = this.state;
        n._values = t, n.values = this.config.transform(t)
    }
    computeInitial() {
        const t = this.state;
        t._initial = t._values, t.initial = t.values
    }
    compute(t) {
        const {
            state: n,
            config: r,
            shared: o
        } = this;
        n.args = this.args;
        let i = 0;
        if (t && (n.event = t, r.preventDefault && t.cancelable && n.event.preventDefault(), n.type = t.type, o.touches = this.ctrl.pointerIds.size || this.ctrl.touchIds.size, o.locked = !!document.pointerLockElement, Object.assign(o, Au(t)), o.down = o.pressed = o.buttons % 2 === 1 || o.touches > 0, i = t.timeStamp - n.timeStamp, n.timeStamp = t.timeStamp, n.elapsedTime = n.timeStamp - n.startTime), n._active) {
            const E = n._delta.map(Math.abs);
            Y.addTo(n._distance, E)
        }
        this.axisIntent && this.axisIntent(t);
        const [s, a] = n._movement, [c, l] = r.threshold, {
            _step: u,
            values: f
        } = n;
        if (r.hasCustomTransform ? (u[0] === !1 && (u[0] = Math.abs(s) >= c && f[0]), u[1] === !1 && (u[1] = Math.abs(a) >= l && f[1])) : (u[0] === !1 && (u[0] = Math.abs(s) >= c && Math.sign(s) * c), u[1] === !1 && (u[1] = Math.abs(a) >= l && Math.sign(a) * l)), n.intentional = u[0] !== !1 || u[1] !== !1, !n.intentional) return;
        const d = [0, 0];
        if (r.hasCustomTransform) {
            const [E, S] = f;
            d[0] = u[0] !== !1 ? E - u[0] : 0, d[1] = u[1] !== !1 ? S - u[1] : 0
        } else d[0] = u[0] !== !1 ? s - u[0] : 0, d[1] = u[1] !== !1 ? a - u[1] : 0;
        this.restrictToAxis && !n._blocked && this.restrictToAxis(d);
        const h = n.offset,
            p = n._active && !n._blocked || n.active;
        p && (n.first = n._active && !n.active, n.last = !n._active && n.active, n.active = o[this.ingKey] = n._active, t && (n.first && ("bounds" in r && (n._bounds = Rn(r.bounds, n)), this.setup && this.setup()), n.movement = d, this.computeOffset()));
        const [m, v] = n.offset, [
            [b, _],
            [x, w]
        ] = n._bounds;
        n.overflow = [m < b ? -1 : m > _ ? 1 : 0, v < x ? -1 : v > w ? 1 : 0], n._movementBound[0] = n.overflow[0] ? n._movementBound[0] === !1 ? n._movement[0] : n._movementBound[0] : !1, n._movementBound[1] = n.overflow[1] ? n._movementBound[1] === !1 ? n._movement[1] : n._movementBound[1] : !1;
        const C = n._active ? r.rubberband || [0, 0] : [0, 0];
        if (n.offset = _u(n._bounds, n.offset, C), n.delta = Y.sub(n.offset, h), this.computeMovement(), p && (!n.last || i > ju)) {
            n.delta = Y.sub(n.offset, h);
            const E = n.delta.map(Math.abs);
            Y.addTo(n.distance, E), n.direction = n.delta.map(Math.sign), n._direction = n._delta.map(Math.sign), !n.first && i > 0 && (n.velocity = [E[0] / i, E[1] / i], n.timeDelta = i)
        }
    }
    emit() {
        const t = this.state,
            n = this.shared,
            r = this.config;
        if (t._active || this.clean(), (t._blocked || !t.intentional) && !t._force && !r.triggerAllEvents) return;
        const o = this.handler(X(X(X({}, n), t), {}, {
            [this.aliasKey]: t.values
        }));
        o !== void 0 && (t.memo = o)
    }
    clean() {
        this.eventStore.clean(), this.timeoutStore.clean()
    }
}

function Lu([e, t], n) {
    const r = Math.abs(e),
        o = Math.abs(t);
    if (r > o && r > n) return "x";
    if (o > r && o > n) return "y"
}
class Kt extends fa {
    constructor(...t) {
        super(...t), ee(this, "aliasKey", "xy")
    }
    reset() {
        super.reset(), this.state.axis = void 0
    }
    init() {
        this.state.offset = [0, 0], this.state.lastOffset = [0, 0]
    }
    computeOffset() {
        this.state.offset = Y.add(this.state.lastOffset, this.state.movement)
    }
    computeMovement() {
        this.state.movement = Y.sub(this.state.offset, this.state.lastOffset)
    }
    axisIntent(t) {
        const n = this.state,
            r = this.config;
        if (!n.axis && t) {
            const o = typeof r.axisThreshold == "object" ? r.axisThreshold[ca(t)] : r.axisThreshold;
            n.axis = Lu(n._movement, o)
        }
        n._blocked = (r.lockDirection || !!r.axis) && !n.axis || !!r.axis && r.axis !== n.axis
    }
    restrictToAxis(t) {
        if (this.config.axis || this.config.lockDirection) switch (this.state.axis) {
            case "x":
                t[1] = 0;
                break;
            case "y":
                t[0] = 0;
                break
        }
    }
}
const Nu = e => e,
    gi = .15,
    da = {
        enabled(e = !0) {
            return e
        },
        eventOptions(e, t, n) {
            return X(X({}, n.shared.eventOptions), e)
        },
        preventDefault(e = !1) {
            return e
        },
        triggerAllEvents(e = !1) {
            return e
        },
        rubberband(e = 0) {
            switch (e) {
                case !0:
                    return [gi, gi];
                case !1:
                    return [0, 0];
                default:
                    return Y.toVector(e)
            }
        },
        from(e) {
            if (typeof e == "function") return e;
            if (e != null) return Y.toVector(e)
        },
        transform(e, t, n) {
            const r = e || n.shared.transform;
            return this.hasCustomTransform = !!r, r || Nu
        },
        threshold(e) {
            return Y.toVector(e, 0)
        }
    },
    Fu = 0,
    it = X(X({}, da), {}, {
        axis(e, t, {
            axis: n
        }) {
            if (this.lockDirection = n === "lock", !this.lockDirection) return n
        },
        axisThreshold(e = Fu) {
            return e
        },
        bounds(e = {}) {
            if (typeof e == "function") return i => it.bounds(e(i));
            if ("current" in e) return () => e.current;
            if (typeof HTMLElement == "function" && e instanceof HTMLElement) return e;
            const {
                left: t = -1 / 0,
                right: n = 1 / 0,
                top: r = -1 / 0,
                bottom: o = 1 / 0
            } = e;
            return [
                [t, n],
                [r, o]
            ]
        }
    }),
    mi = {
        ArrowRight: (e, t = 1) => [e * t, 0],
        ArrowLeft: (e, t = 1) => [-1 * e * t, 0],
        ArrowUp: (e, t = 1) => [0, -1 * e * t],
        ArrowDown: (e, t = 1) => [0, e * t]
    };
class zu extends Kt {
    constructor(...t) {
        super(...t), ee(this, "ingKey", "dragging")
    }
    reset() {
        super.reset();
        const t = this.state;
        t._pointerId = void 0, t._pointerActive = !1, t._keyboardActive = !1, t._preventScroll = !1, t._delayed = !1, t.swipe = [0, 0], t.tap = !1, t.canceled = !1, t.cancel = this.cancel.bind(this)
    }
    setup() {
        const t = this.state;
        if (t._bounds instanceof HTMLElement) {
            const n = t._bounds.getBoundingClientRect(),
                r = t.currentTarget.getBoundingClientRect(),
                o = {
                    left: n.left - r.left + t.offset[0],
                    right: n.right - r.right + t.offset[0],
                    top: n.top - r.top + t.offset[1],
                    bottom: n.bottom - r.bottom + t.offset[1]
                };
            t._bounds = it.bounds(o)
        }
    }
    cancel() {
        const t = this.state;
        t.canceled || (t.canceled = !0, t._active = !1, setTimeout(() => {
            this.compute(), this.emit()
        }, 0))
    }
    setActive() {
        this.state._active = this.state._pointerActive || this.state._keyboardActive
    }
    clean() {
        this.pointerClean(), this.state._pointerActive = !1, this.state._keyboardActive = !1, super.clean()
    }
    pointerDown(t) {
        const n = this.config,
            r = this.state;
        if (t.buttons != null && (Array.isArray(n.pointerButtons) ? !n.pointerButtons.includes(t.buttons) : n.pointerButtons !== -1 && n.pointerButtons !== t.buttons)) return;
        const o = this.ctrl.setEventIds(t);
        n.pointerCapture && t.target.setPointerCapture(t.pointerId), !(o && o.size > 1 && r._pointerActive) && (this.start(t), this.setupPointer(t), r._pointerId = hr(t), r._pointerActive = !0, this.computeValues(bt(t)), this.computeInitial(), n.preventScrollAxis && ca(t) !== "mouse" ? (r._active = !1, this.setupScrollPrevention(t)) : n.delay > 0 ? (this.setupDelayTrigger(t), n.triggerAllEvents && (this.compute(t), this.emit())) : this.startPointerDrag(t))
    }
    startPointerDrag(t) {
        const n = this.state;
        n._active = !0, n._preventScroll = !0, n._delayed = !1, this.compute(t), this.emit()
    }
    pointerMove(t) {
        const n = this.state,
            r = this.config;
        if (!n._pointerActive) return;
        const o = hr(t);
        if (n._pointerId !== void 0 && o !== n._pointerId) return;
        const i = bt(t);
        if (document.pointerLockElement === t.target ? n._delta = [t.movementX, t.movementY] : (n._delta = Y.sub(i, n._values), this.computeValues(i)), Y.addTo(n._movement, n._delta), this.compute(t), n._delayed && n.intentional) {
            this.timeoutStore.remove("dragDelay"), n.active = !1, this.startPointerDrag(t);
            return
        }
        if (r.preventScrollAxis && !n._preventScroll)
            if (n.axis)
                if (n.axis === r.preventScrollAxis || r.preventScrollAxis === "xy") {
                    n._active = !1, this.clean();
                    return
                } else {
                    this.timeoutStore.remove("startPointerDrag"), this.startPointerDrag(t);
                    return
                }
        else return;
        this.emit()
    }
    pointerUp(t) {
        this.ctrl.setEventIds(t);
        try {
            this.config.pointerCapture && t.target.hasPointerCapture(t.pointerId) && t.target.releasePointerCapture(t.pointerId)
        } catch {}
        const n = this.state,
            r = this.config;
        if (!n._active || !n._pointerActive) return;
        const o = hr(t);
        if (n._pointerId !== void 0 && o !== n._pointerId) return;
        this.state._pointerActive = !1, this.setActive(), this.compute(t);
        const [i, s] = n._distance;
        if (n.tap = i <= r.tapsThreshold && s <= r.tapsThreshold, n.tap && r.filterTaps) n._force = !0;
        else {
            const [a, c] = n._delta, [l, u] = n._movement, [f, d] = r.swipe.velocity, [h, p] = r.swipe.distance, m = r.swipe.duration;
            if (n.elapsedTime < m) {
                const v = Math.abs(a / n.timeDelta),
                    b = Math.abs(c / n.timeDelta);
                v > f && Math.abs(l) > h && (n.swipe[0] = Math.sign(a)), b > d && Math.abs(u) > p && (n.swipe[1] = Math.sign(c))
            }
        }
        this.emit()
    }
    pointerClick(t) {
        !this.state.tap && t.detail > 0 && (t.preventDefault(), t.stopPropagation())
    }
    setupPointer(t) {
        const n = this.config,
            r = n.device;
        n.pointerLock && t.currentTarget.requestPointerLock(), n.pointerCapture || (this.eventStore.add(this.sharedConfig.window, r, "change", this.pointerMove.bind(this)), this.eventStore.add(this.sharedConfig.window, r, "end", this.pointerUp.bind(this)), this.eventStore.add(this.sharedConfig.window, r, "cancel", this.pointerUp.bind(this)))
    }
    pointerClean() {
        this.config.pointerLock && document.pointerLockElement === this.state.currentTarget && document.exitPointerLock()
    }
    preventScroll(t) {
        this.state._preventScroll && t.cancelable && t.preventDefault()
    }
    setupScrollPrevention(t) {
        this.state._preventScroll = !1, Wu(t);
        const n = this.eventStore.add(this.sharedConfig.window, "touch", "change", this.preventScroll.bind(this), {
            passive: !1
        });
        this.eventStore.add(this.sharedConfig.window, "touch", "end", n), this.eventStore.add(this.sharedConfig.window, "touch", "cancel", n), this.timeoutStore.add("startPointerDrag", this.startPointerDrag.bind(this), this.config.preventScrollDelay, t)
    }
    setupDelayTrigger(t) {
        this.state._delayed = !0, this.timeoutStore.add("dragDelay", () => {
            this.state._step = [0, 0], this.startPointerDrag(t)
        }, this.config.delay)
    }
    keyDown(t) {
        const n = mi[t.key];
        if (n) {
            const r = this.state,
                o = t.shiftKey ? 10 : t.altKey ?.1 : 1;
            this.start(t), r._delta = n(this.config.keyboardDisplacement, o), r._keyboardActive = !0, Y.addTo(r._movement, r._delta), this.compute(t), this.emit()
        }
    }
    keyUp(t) {
        t.key in mi && (this.state._keyboardActive = !1, this.setActive(), this.compute(t), this.emit())
    }
    bind(t) {
        const n = this.config.device;
        t(n, "start", this.pointerDown.bind(this)), this.config.pointerCapture && (t(n, "change", this.pointerMove.bind(this)), t(n, "end", this.pointerUp.bind(this)), t(n, "cancel", this.pointerUp.bind(this)), t("lostPointerCapture", "", this.pointerUp.bind(this))), this.config.keys && (t("key", "down", this.keyDown.bind(this)), t("key", "up", this.keyUp.bind(this))), this.config.filterTaps && t("click", "", this.pointerClick.bind(this), {
            capture: !0,
            passive: !1
        })
    }
}

function Wu(e) {
    "persist" in e && typeof e.persist == "function" && e.persist()
}
const Gt = typeof window < "u" && window.document && window.document.createElement;

function ha() {
    return Gt && "ontouchstart" in window
}

function Bu() {
    return ha() || Gt && window.navigator.maxTouchPoints > 1
}

function Hu() {
    return Gt && "onpointerdown" in window
}

function Vu() {
    return Gt && "exitPointerLock" in window.document
}

function Uu() {
    try {
        return "constructor" in GestureEvent
    } catch {
        return !1
    }
}
const ve = {
        isBrowser: Gt,
        gesture: Uu(),
        touch: ha(),
        touchscreen: Bu(),
        pointer: Hu(),
        pointerLock: Vu()
    },
    qu = 250,
    Ku = 180,
    Gu = .5,
    Yu = 50,
    Qu = 250,
    Xu = 10,
    vi = {
        mouse: 0,
        touch: 0,
        pen: 8
    },
    Ju = X(X({}, it), {}, {
        device(e, t, {
            pointer: {
                touch: n = !1,
                lock: r = !1,
                mouse: o = !1
            } = {}
        }) {
            return this.pointerLock = r && ve.pointerLock, ve.touch && n ? "touch" : this.pointerLock ? "mouse" : ve.pointer && !o ? "pointer" : ve.touch ? "touch" : "mouse"
        },
        preventScrollAxis(e, t, {
            preventScroll: n
        }) {
            if (this.preventScrollDelay = typeof n == "number" ? n : n || n === void 0 && e ? qu : void 0, !(!ve.touchscreen || n === !1)) return e || (n !== void 0 ? "y" : void 0)
        },
        pointerCapture(e, t, {
            pointer: {
                capture: n = !0,
                buttons: r = 1,
                keys: o = !0
            } = {}
        }) {
            return this.pointerButtons = r, this.keys = o, !this.pointerLock && this.device === "pointer" && n
        },
        threshold(e, t, {
            filterTaps: n = !1,
            tapsThreshold: r = 3,
            axis: o = void 0
        }) {
            const i = Y.toVector(e, n ? r : o ? 1 : 0);
            return this.filterTaps = n, this.tapsThreshold = r, i
        },
        swipe({
            velocity: e = Gu,
            distance: t = Yu,
            duration: n = Qu
        } = {}) {
            return {
                velocity: this.transform(Y.toVector(e)),
                distance: this.transform(Y.toVector(t)),
                duration: n
            }
        },
        delay(e = 0) {
            switch (e) {
                case !0:
                    return Ku;
                case !1:
                    return 0;
                default:
                    return e
            }
        },
        axisThreshold(e) {
            return e ? X(X({}, vi), e) : vi
        },
        keyboardDisplacement(e = Xu) {
            return e
        }
    });

function pa(e) {
    const [t, n] = e.overflow, [r, o] = e._delta, [i, s] = e._direction;
    (t < 0 && r > 0 && i < 0 || t > 0 && r < 0 && i > 0) && (e._movement[0] = e._movementBound[0]), (n < 0 && o > 0 && s < 0 || n > 0 && o < 0 && s > 0) && (e._movement[1] = e._movementBound[1])
}
const Zu = 30,
    ef = 100;
class tf extends fa {
    constructor(...t) {
        super(...t), ee(this, "ingKey", "pinching"), ee(this, "aliasKey", "da")
    }
    init() {
        this.state.offset = [1, 0], this.state.lastOffset = [1, 0], this.state._pointerEvents = new Map
    }
    reset() {
        super.reset();
        const t = this.state;
        t._touchIds = [], t.canceled = !1, t.cancel = this.cancel.bind(this), t.turns = 0
    }
    computeOffset() {
        const {
            type: t,
            movement: n,
            lastOffset: r
        } = this.state;
        t === "wheel" ? this.state.offset = Y.add(n, r) : this.state.offset = [(1 + n[0]) * r[0], n[1] + r[1]]
    }
    computeMovement() {
        const {
            offset: t,
            lastOffset: n
        } = this.state;
        this.state.movement = [t[0] / n[0], t[1] - n[1]]
    }
    axisIntent() {
        const t = this.state,
            [n, r] = t._movement;
        if (!t.axis) {
            const o = Math.abs(n) * Zu - Math.abs(r);
            o < 0 ? t.axis = "angle" : o > 0 && (t.axis = "scale")
        }
    }
    restrictToAxis(t) {
        this.config.lockDirection && (this.state.axis === "scale" ? t[1] = 0 : this.state.axis === "angle" && (t[0] = 0))
    }
    cancel() {
        const t = this.state;
        t.canceled || setTimeout(() => {
            t.canceled = !0, t._active = !1, this.compute(), this.emit()
        }, 0)
    }
    touchStart(t) {
        this.ctrl.setEventIds(t);
        const n = this.state,
            r = this.ctrl.touchIds;
        if (n._active && n._touchIds.every(i => r.has(i)) || r.size < 2) return;
        this.start(t), n._touchIds = Array.from(r).slice(0, 2);
        const o = fi(t, n._touchIds);
        o && this.pinchStart(t, o)
    }
    pointerStart(t) {
        if (t.buttons != null && t.buttons % 2 !== 1) return;
        this.ctrl.setEventIds(t), t.target.setPointerCapture(t.pointerId);
        const n = this.state,
            r = n._pointerEvents,
            o = this.ctrl.pointerIds;
        if (n._active && Array.from(r.keys()).every(s => o.has(s)) || (r.size < 2 && r.set(t.pointerId, t), n._pointerEvents.size < 2)) return;
        this.start(t);
        const i = Jr(...Array.from(r.values()));
        i && this.pinchStart(t, i)
    }
    pinchStart(t, n) {
        const r = this.state;
        r.origin = n.origin, this.computeValues([n.distance, n.angle]), this.computeInitial(), this.compute(t), this.emit()
    }
    touchMove(t) {
        if (!this.state._active) return;
        const n = fi(t, this.state._touchIds);
        n && this.pinchMove(t, n)
    }
    pointerMove(t) {
        const n = this.state._pointerEvents;
        if (n.has(t.pointerId) && n.set(t.pointerId, t), !this.state._active) return;
        const r = Jr(...Array.from(n.values()));
        r && this.pinchMove(t, r)
    }
    pinchMove(t, n) {
        const r = this.state,
            o = r._values[1],
            i = n.angle - o;
        let s = 0;
        Math.abs(i) > 270 && (s += Math.sign(i)), this.computeValues([n.distance, n.angle - 360 * s]), r.origin = n.origin, r.turns = s, r._movement = [r._values[0] / r._initial[0] - 1, r._values[1] - r._initial[1]], this.compute(t), this.emit()
    }
    touchEnd(t) {
        this.ctrl.setEventIds(t), this.state._active && this.state._touchIds.some(n => !this.ctrl.touchIds.has(n)) && (this.state._active = !1, this.compute(t), this.emit())
    }
    pointerEnd(t) {
        const n = this.state;
        this.ctrl.setEventIds(t);
        try {
            t.target.releasePointerCapture(t.pointerId)
        } catch {}
        n._pointerEvents.has(t.pointerId) && n._pointerEvents.delete(t.pointerId), n._active && n._pointerEvents.size < 2 && (n._active = !1, this.compute(t), this.emit())
    }
    gestureStart(t) {
        t.cancelable && t.preventDefault();
        const n = this.state;
        n._active || (this.start(t), this.computeValues([t.scale, t.rotation]), n.origin = [t.clientX, t.clientY], this.compute(t), this.emit())
    }
    gestureMove(t) {
        if (t.cancelable && t.preventDefault(), !this.state._active) return;
        const n = this.state;
        this.computeValues([t.scale, t.rotation]), n.origin = [t.clientX, t.clientY];
        const r = n._movement;
        n._movement = [t.scale - 1, t.rotation], n._delta = Y.sub(n._movement, r), this.compute(t), this.emit()
    }
    gestureEnd(t) {
        this.state._active && (this.state._active = !1, this.compute(t), this.emit())
    }
    wheel(t) {
        const n = this.config.modifierKey;
        n && (Array.isArray(n) ? !n.find(r => t[r]) : !t[n]) || (this.state._active ? this.wheelChange(t) : this.wheelStart(t), this.timeoutStore.add("wheelEnd", this.wheelEnd.bind(this)))
    }
    wheelStart(t) {
        this.start(t), this.wheelChange(t)
    }
    wheelChange(t) {
        "uv" in t || t.cancelable && t.preventDefault();
        const r = this.state;
        r._delta = [-ua(t)[1] / ef * r.offset[0], 0], Y.addTo(r._movement, r._delta), pa(r), this.state.origin = [t.clientX, t.clientY], this.compute(t), this.emit()
    }
    wheelEnd() {
        this.state._active && (this.state._active = !1, this.compute(), this.emit())
    }
    bind(t) {
        const n = this.config.device;
        n && (t(n, "start", this[n + "Start"].bind(this)), t(n, "change", this[n + "Move"].bind(this)), t(n, "end", this[n + "End"].bind(this)), t(n, "cancel", this[n + "End"].bind(this)), t("lostPointerCapture", "", this[n + "End"].bind(this))), this.config.pinchOnWheel && t("wheel", "", this.wheel.bind(this), {
            passive: !1
        })
    }
}
const nf = X(X({}, da), {}, {
    device(e, t, {
        shared: n,
        pointer: {
            touch: r = !1
        } = {}
    }) {
        if (n.target && !ve.touch && ve.gesture) return "gesture";
        if (ve.touch && r) return "touch";
        if (ve.touchscreen) {
            if (ve.pointer) return "pointer";
            if (ve.touch) return "touch"
        }
    },
    bounds(e, t, {
        scaleBounds: n = {},
        angleBounds: r = {}
    }) {
        const o = s => {
                const a = pi(Rn(n, s), {
                    min: -1 / 0,
                    max: 1 / 0
                });
                return [a.min, a.max]
            },
            i = s => {
                const a = pi(Rn(r, s), {
                    min: -1 / 0,
                    max: 1 / 0
                });
                return [a.min, a.max]
            };
        return typeof n != "function" && typeof r != "function" ? [o(), i()] : s => [o(s), i(s)]
    },
    threshold(e, t, n) {
        return this.lockDirection = n.axis === "lock", Y.toVector(e, this.lockDirection ? [.1, 3] : 0)
    },
    modifierKey(e) {
        return e === void 0 ? "ctrlKey" : e
    },
    pinchOnWheel(e = !0) {
        return e
    }
});
class rf extends Kt {
    constructor(...t) {
        super(...t), ee(this, "ingKey", "moving")
    }
    move(t) {
        this.config.mouseOnly && t.pointerType !== "mouse" || (this.state._active ? this.moveChange(t) : this.moveStart(t), this.timeoutStore.add("moveEnd", this.moveEnd.bind(this)))
    }
    moveStart(t) {
        this.start(t), this.computeValues(bt(t)), this.compute(t), this.computeInitial(), this.emit()
    }
    moveChange(t) {
        if (!this.state._active) return;
        const n = bt(t),
            r = this.state;
        r._delta = Y.sub(n, r._values), Y.addTo(r._movement, r._delta), this.computeValues(n), this.compute(t), this.emit()
    }
    moveEnd(t) {
        this.state._active && (this.state._active = !1, this.compute(t), this.emit())
    }
    bind(t) {
        t("pointer", "change", this.move.bind(this)), t("pointer", "leave", this.moveEnd.bind(this))
    }
}
const of = X(X({}, it), {}, {
    mouseOnly: (e = !0) => e
});
class sf extends Kt {
    constructor(...t) {
        super(...t), ee(this, "ingKey", "scrolling")
    }
    scroll(t) {
        this.state._active || this.start(t), this.scrollChange(t), this.timeoutStore.add("scrollEnd", this.scrollEnd.bind(this))
    }
    scrollChange(t) {
        t.cancelable && t.preventDefault();
        const n = this.state,
            r = Pu(t);
        n._delta = Y.sub(r, n._values), Y.addTo(n._movement, n._delta), this.computeValues(r), this.compute(t), this.emit()
    }
    scrollEnd() {
        this.state._active && (this.state._active = !1, this.compute(), this.emit())
    }
    bind(t) {
        t("scroll", "", this.scroll.bind(this))
    }
}
const af = it;
class cf extends Kt {
    constructor(...t) {
        super(...t), ee(this, "ingKey", "wheeling")
    }
    wheel(t) {
        this.state._active || this.start(t), this.wheelChange(t), this.timeoutStore.add("wheelEnd", this.wheelEnd.bind(this))
    }
    wheelChange(t) {
        const n = this.state;
        n._delta = ua(t), Y.addTo(n._movement, n._delta), pa(n), this.compute(t), this.emit()
    }
    wheelEnd() {
        this.state._active && (this.state._active = !1, this.compute(), this.emit())
    }
    bind(t) {
        t("wheel", "", this.wheel.bind(this))
    }
}
const lf = it;
class uf extends Kt {
    constructor(...t) {
        super(...t), ee(this, "ingKey", "hovering")
    }
    enter(t) {
        this.config.mouseOnly && t.pointerType !== "mouse" || (this.start(t), this.computeValues(bt(t)), this.compute(t), this.emit())
    }
    leave(t) {
        if (this.config.mouseOnly && t.pointerType !== "mouse") return;
        const n = this.state;
        if (!n._active) return;
        n._active = !1;
        const r = bt(t);
        n._movement = n._delta = Y.sub(r, n._values), this.computeValues(r), this.compute(t), n.delta = n.movement, this.emit()
    }
    bind(t) {
        t("pointer", "enter", this.enter.bind(this)), t("pointer", "leave", this.leave.bind(this))
    }
}
const ff = X(X({}, it), {}, {
        mouseOnly: (e = !0) => e
    }),
    To = new Map,
    Zr = new Map;

function ga(e) {
    To.set(e.key, e.engine), Zr.set(e.key, e.resolver)
}
const ma = {
        key: "drag",
        engine: zu,
        resolver: Ju
    },
    df = {
        key: "hover",
        engine: uf,
        resolver: ff
    },
    hf = {
        key: "move",
        engine: rf,
        resolver: of
    },
    pf = {
        key: "pinch",
        engine: tf,
        resolver: nf
    },
    gf = {
        key: "scroll",
        engine: sf,
        resolver: af
    },
    mf = {
        key: "wheel",
        engine: cf,
        resolver: lf
    };

function vf(e, t) {
    if (e == null) return {};
    var n = {},
        r = Object.keys(e),
        o, i;
    for (i = 0; i < r.length; i++) o = r[i], !(t.indexOf(o) >= 0) && (n[o] = e[o]);
    return n
}

function bf(e, t) {
    if (e == null) return {};
    var n = vf(e, t),
        r, o;
    if (Object.getOwnPropertySymbols) {
        var i = Object.getOwnPropertySymbols(e);
        for (o = 0; o < i.length; o++) r = i[o], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r])
    }
    return n
}
const yf = {
        target(e) {
            if (e) return () => "current" in e ? e.current : e
        },
        enabled(e = !0) {
            return e
        },
        window(e = ve.isBrowser ? window : void 0) {
            return e
        },
        eventOptions({
            passive: e = !0,
            capture: t = !1
        } = {}) {
            return {
                passive: e,
                capture: t
            }
        },
        transform(e) {
            return e
        }
    },
    _f = ["target", "eventOptions", "window", "enabled", "transform"];

function wn(e = {}, t) {
    const n = {};
    for (const [r, o] of Object.entries(t)) switch (typeof o) {
        case "function":
            n[r] = o.call(n, e[r], r, e);
            break;
        case "object":
            n[r] = wn(e[r], o);
            break;
        case "boolean":
            o && (n[r] = e[r]);
            break
    }
    return n
}

function xf(e, t, n = {}) {
    const r = e,
        {
            target: o,
            eventOptions: i,
            window: s,
            enabled: a,
            transform: c
        } = r,
        l = bf(r, _f);
    if (n.shared = wn({
            target: o,
            eventOptions: i,
            window: s,
            enabled: a,
            transform: c
        }, yf), t) {
        const u = Zr.get(t);
        n[t] = wn(X({
            shared: n.shared
        }, l), u)
    } else
        for (const u in l) {
            const f = Zr.get(u);
            f && (n[u] = wn(X({
                shared: n.shared
            }, l[u]), f))
        }
    return n
}
class va {
    constructor(t, n) {
        ee(this, "_listeners", new Set), this._ctrl = t, this._gestureKey = n
    }
    add(t, n, r, o, i) {
        const s = this._listeners,
            a = Ru(n, r),
            c = this._gestureKey ? this._ctrl.config[this._gestureKey].eventOptions : {},
            l = X(X({}, c), i);
        t.addEventListener(a, o, l);
        const u = () => {
            t.removeEventListener(a, o, l), s.delete(u)
        };
        return s.add(u), u
    }
    clean() {
        this._listeners.forEach(t => t()), this._listeners.clear()
    }
}
class wf {
    constructor() {
        ee(this, "_timeouts", new Map)
    }
    add(t, n, r = 140, ...o) {
        this.remove(t), this._timeouts.set(t, window.setTimeout(n, r, ...o))
    }
    remove(t) {
        const n = this._timeouts.get(t);
        n && window.clearTimeout(n)
    }
    clean() {
        this._timeouts.forEach(t => {
            window.clearTimeout(t)
        }), this._timeouts.clear()
    }
}
class Ef {
    constructor(t) {
        ee(this, "gestures", new Set), ee(this, "_targetEventStore", new va(this)), ee(this, "gestureEventStores", {}), ee(this, "gestureTimeoutStores", {}), ee(this, "handlers", {}), ee(this, "config", {}), ee(this, "pointerIds", new Set), ee(this, "touchIds", new Set), ee(this, "state", {
            shared: {
                shiftKey: !1,
                metaKey: !1,
                ctrlKey: !1,
                altKey: !1
            }
        }), $f(this, t)
    }
    setEventIds(t) {
        if (Un(t)) return this.touchIds = new Set(Iu(t)), this.touchIds;
        if ("pointerId" in t) return t.type === "pointerup" || t.type === "pointercancel" ? this.pointerIds.delete(t.pointerId) : t.type === "pointerdown" && this.pointerIds.add(t.pointerId), this.pointerIds
    }
    applyHandlers(t, n) {
        this.handlers = t, this.nativeHandlers = n
    }
    applyConfig(t, n) {
        this.config = xf(t, n, this.config)
    }
    clean() {
        this._targetEventStore.clean();
        for (const t of this.gestures) this.gestureEventStores[t].clean(), this.gestureTimeoutStores[t].clean()
    }
    effect() {
        return this.config.shared.target && this.bind(), () => this._targetEventStore.clean()
    }
    bind(...t) {
        const n = this.config.shared,
            r = {};
        let o;
        if (!(n.target && (o = n.target(), !o))) {
            if (n.enabled) {
                for (const s of this.gestures) {
                    const a = this.config[s],
                        c = bi(r, a.eventOptions, !!o);
                    if (a.enabled) {
                        const l = To.get(s);
                        new l(this, t, s).bind(c)
                    }
                }
                const i = bi(r, n.eventOptions, !!o);
                for (const s in this.nativeHandlers) i(s, "", a => this.nativeHandlers[s](X(X({}, this.state.shared), {}, {
                    event: a,
                    args: t
                })), void 0, !0)
            }
            for (const i in r) r[i] = Mu(...r[i]);
            if (!o) return r;
            for (const i in r) {
                const {
                    device: s,
                    capture: a,
                    passive: c
                } = Tu(i);
                this._targetEventStore.add(o, s, "", r[i], {
                    capture: a,
                    passive: c
                })
            }
        }
    }
}

function ut(e, t) {
    e.gestures.add(t), e.gestureEventStores[t] = new va(e, t), e.gestureTimeoutStores[t] = new wf
}

function $f(e, t) {
    t.drag && ut(e, "drag"), t.wheel && ut(e, "wheel"), t.scroll && ut(e, "scroll"), t.move && ut(e, "move"), t.pinch && ut(e, "pinch"), t.hover && ut(e, "hover")
}
const bi = (e, t, n) => (r, o, i, s = {}, a = !1) => {
        var c, l;
        const u = (c = s.capture) !== null && c !== void 0 ? c : t.capture,
            f = (l = s.passive) !== null && l !== void 0 ? l : t.passive;
        let d = a ? r : Su(r, o, u);
        n && f && (d += "Passive"), e[d] = e[d] || [], e[d].push(i)
    },
    Sf = /^on(Drag|Wheel|Scroll|Move|Pinch|Hover)/;

function Cf(e) {
    const t = {},
        n = {},
        r = new Set;
    for (let o in e) Sf.test(o) ? (r.add(RegExp.lastMatch), n[o] = e[o]) : t[o] = e[o];
    return [n, t, r]
}

function ft(e, t, n, r, o, i) {
    if (!e.has(n) || !To.has(r)) return;
    const s = n + "Start",
        a = n + "End",
        c = l => {
            let u;
            return l.first && s in t && t[s](l), n in t && (u = t[n](l)), l.last && a in t && t[a](l), u
        };
    o[r] = c, i[r] = i[r] || {}
}

function Tf(e, t) {
    const [n, r, o] = Cf(e), i = {};
    return ft(o, n, "onDrag", "drag", i, t), ft(o, n, "onWheel", "wheel", i, t), ft(o, n, "onScroll", "scroll", i, t), ft(o, n, "onPinch", "pinch", i, t), ft(o, n, "onMove", "move", i, t), ft(o, n, "onHover", "hover", i, t), {
        handlers: i,
        config: t,
        nativeHandlers: r
    }
}

function ba(e, t = {}, n, r) {
    const o = y.useMemo(() => new Ef(e), []);
    if (o.applyHandlers(e, r), o.applyConfig(t, n), y.useEffect(o.effect.bind(o)), y.useEffect(() => o.clean.bind(o), []), t.target === void 0) return o.bind.bind(o)
}

function Rf(e, t) {
    return ga(ma), ba({
        drag: e
    }, t || {}, "drag")
}

function Of(e) {
    return e.forEach(ga),
        function(n, r) {
            const {
                handlers: o,
                nativeHandlers: i,
                config: s
            } = Tf(n, r || {});
            return ba(o, s, void 0, i)
        }
}

function b0(e, t) {
    return Of([ma, pf, gf, mf, hf, df])(e, t || {})
}

function je(e, t, {
    checkForDefaultPrevented: n = !0
} = {}) {
    return function(o) {
        if (e ?.(o), n === !1 || !o.defaultPrevented) return t ?.(o)
    }
}

function ya(e, t = []) {
    let n = [];

    function r(i, s) {
        const a = g.createContext(s),
            c = n.length;
        n = [...n, s];
        const l = f => {
            const {
                scope: d,
                children: h,
                ...p
            } = f, m = d ?.[e] ?.[c] || a, v = g.useMemo(() => p, Object.values(p));
            return H.jsx(m.Provider, {
                value: v,
                children: h
            })
        };
        l.displayName = i + "Provider";

        function u(f, d) {
            const h = d ?.[e] ?.[c] || a,
                p = g.useContext(h);
            if (p) return p;
            if (s !== void 0) return s;
            throw new Error(`\`${f}\` must be used within \`${i}\``)
        }
        return [l, u]
    }
    const o = () => {
        const i = n.map(s => g.createContext(s));
        return function(a) {
            const c = a ?.[e] || i;
            return g.useMemo(() => ({
                [`__scope${e}`]: { ...a,
                    [e]: c
                }
            }), [a, c])
        }
    };
    return o.scopeName = e, [r, kf(o, ...t)]
}

function kf(...e) {
    const t = e[0];
    if (e.length === 1) return t;
    const n = () => {
        const r = e.map(o => ({
            useScope: o(),
            scopeName: o.scopeName
        }));
        return function(i) {
            const s = r.reduce((a, {
                useScope: c,
                scopeName: l
            }) => {
                const f = c(i)[`__scope${l}`];
                return { ...a,
                    ...f
                }
            }, {});
            return g.useMemo(() => ({
                [`__scope${t.scopeName}`]: s
            }), [s])
        }
    };
    return n.scopeName = t.scopeName, n
}

function Yt(e) {
    const t = If(e),
        n = g.forwardRef((r, o) => {
            const {
                children: i,
                ...s
            } = r, a = g.Children.toArray(i), c = a.find(Af);
            if (c) {
                const l = c.props.children,
                    u = a.map(f => f === c ? g.Children.count(l) > 1 ? g.Children.only(null) : g.isValidElement(l) ? l.props.children : null : f);
                return H.jsx(t, { ...s,
                    ref: o,
                    children: g.isValidElement(l) ? g.cloneElement(l, void 0, u) : null
                })
            }
            return H.jsx(t, { ...s,
                ref: o,
                children: i
            })
        });
    return n.displayName = `${e}.Slot`, n
}

function If(e) {
    const t = g.forwardRef((n, r) => {
        const {
            children: o,
            ...i
        } = n;
        if (g.isValidElement(o)) {
            const s = Mf(o),
                a = Df(i, o.props);
            return o.type !== g.Fragment && (a.ref = r ? $o(r, s) : s), g.cloneElement(o, a)
        }
        return g.Children.count(o) > 1 ? g.Children.only(null) : null
    });
    return t.displayName = `${e}.SlotClone`, t
}
var _a = Symbol("radix.slottable");

function Pf(e) {
    const t = ({
        children: n
    }) => H.jsx(H.Fragment, {
        children: n
    });
    return t.displayName = `${e}.Slottable`, t.__radixId = _a, t
}

function Af(e) {
    return g.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === _a
}

function Df(e, t) {
    const n = { ...t
    };
    for (const r in t) {
        const o = e[r],
            i = t[r];
        /^on[A-Z]/.test(r) ? o && i ? n[r] = (...a) => {
            const c = i(...a);
            return o(...a), c
        } : o && (n[r] = o) : r === "style" ? n[r] = { ...o,
            ...i
        } : r === "className" && (n[r] = [o, i].filter(Boolean).join(" "))
    }
    return { ...e,
        ...n
    }
}

function Mf(e) {
    let t = Object.getOwnPropertyDescriptor(e.props, "ref") ?.get,
        n = t && "isReactWarning" in t && t.isReactWarning;
    return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref") ?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref)
}
var jf = ["a", "button", "div", "form", "h2", "h3", "img", "input", "label", "li", "nav", "ol", "p", "select", "span", "svg", "ul"],
    xa = jf.reduce((e, t) => {
        const n = Yt(`Primitive.${t}`),
            r = g.forwardRef((o, i) => {
                const {
                    asChild: s,
                    ...a
                } = o, c = s ? n : t;
                return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), H.jsx(c, { ...a,
                    ref: i
                })
            });
        return r.displayName = `Primitive.${t}`, { ...e,
            [t]: r
        }
    }, {});

function Lf(e, t) {
    e && Js.flushSync(() => e.dispatchEvent(t))
}

function qn(e) {
    const t = g.useRef(e);
    return g.useEffect(() => {
        t.current = e
    }), g.useMemo(() => (...n) => t.current ?.(...n), [])
}

function Nf(e, t = globalThis ?.document) {
    const n = qn(e);
    g.useEffect(() => {
        const r = o => {
            o.key === "Escape" && n(o)
        };
        return t.addEventListener("keydown", r, {
            capture: !0
        }), () => t.removeEventListener("keydown", r, {
            capture: !0
        })
    }, [n, t])
}
var Ff = "DismissableLayer",
    eo = "dismissableLayer.update",
    zf = "dismissableLayer.pointerDownOutside",
    Wf = "dismissableLayer.focusOutside",
    yi, wa = g.createContext({
        layers: new Set,
        layersWithOutsidePointerEventsDisabled: new Set,
        branches: new Set
    }),
    Ea = g.forwardRef((e, t) => {
        const {
            disableOutsidePointerEvents: n = !1,
            onEscapeKeyDown: r,
            onPointerDownOutside: o,
            onFocusOutside: i,
            onInteractOutside: s,
            onDismiss: a,
            ...c
        } = e, l = g.useContext(wa), [u, f] = g.useState(null), d = u ?.ownerDocument ?? globalThis ?.document, [, h] = g.useState({}), p = ot(t, S => f(S)), m = Array.from(l.layers), [v] = [...l.layersWithOutsidePointerEventsDisabled].slice(-1), b = m.indexOf(v), _ = u ? m.indexOf(u) : -1, x = l.layersWithOutsidePointerEventsDisabled.size > 0, w = _ >= b, C = Vf(S => {
            const R = S.target,
                j = [...l.branches].some(T => T.contains(R));
            !w || j || (o ?.(S), s ?.(S), S.defaultPrevented || a ?.())
        }, d), E = Uf(S => {
            const R = S.target;
            [...l.branches].some(T => T.contains(R)) || (i ?.(S), s ?.(S), S.defaultPrevented || a ?.())
        }, d);
        return Nf(S => {
            _ === l.layers.size - 1 && (r ?.(S), !S.defaultPrevented && a && (S.preventDefault(), a()))
        }, d), g.useEffect(() => {
            if (u) return n && (l.layersWithOutsidePointerEventsDisabled.size === 0 && (yi = d.body.style.pointerEvents, d.body.style.pointerEvents = "none"), l.layersWithOutsidePointerEventsDisabled.add(u)), l.layers.add(u), _i(), () => {
                n && l.layersWithOutsidePointerEventsDisabled.size === 1 && (d.body.style.pointerEvents = yi)
            }
        }, [u, d, n, l]), g.useEffect(() => () => {
            u && (l.layers.delete(u), l.layersWithOutsidePointerEventsDisabled.delete(u), _i())
        }, [u, l]), g.useEffect(() => {
            const S = () => h({});
            return document.addEventListener(eo, S), () => document.removeEventListener(eo, S)
        }, []), H.jsx(xa.div, { ...c,
            ref: p,
            style: {
                pointerEvents: x ? w ? "auto" : "none" : void 0,
                ...e.style
            },
            onFocusCapture: je(e.onFocusCapture, E.onFocusCapture),
            onBlurCapture: je(e.onBlurCapture, E.onBlurCapture),
            onPointerDownCapture: je(e.onPointerDownCapture, C.onPointerDownCapture)
        })
    });
Ea.displayName = Ff;
var Bf = "DismissableLayerBranch",
    Hf = g.forwardRef((e, t) => {
        const n = g.useContext(wa),
            r = g.useRef(null),
            o = ot(t, r);
        return g.useEffect(() => {
            const i = r.current;
            if (i) return n.branches.add(i), () => {
                n.branches.delete(i)
            }
        }, [n.branches]), H.jsx(xa.div, { ...e,
            ref: o
        })
    });
Hf.displayName = Bf;

function Vf(e, t = globalThis ?.document) {
    const n = qn(e),
        r = g.useRef(!1),
        o = g.useRef(() => {});
    return g.useEffect(() => {
        const i = a => {
                if (a.target && !r.current) {
                    let c = function() {
                        $a(zf, n, l, {
                            discrete: !0
                        })
                    };
                    const l = {
                        originalEvent: a
                    };
                    a.pointerType === "touch" ? (t.removeEventListener("click", o.current), o.current = c, t.addEventListener("click", o.current, {
                        once: !0
                    })) : c()
                } else t.removeEventListener("click", o.current);
                r.current = !1
            },
            s = window.setTimeout(() => {
                t.addEventListener("pointerdown", i)
            }, 0);
        return () => {
            window.clearTimeout(s), t.removeEventListener("pointerdown", i), t.removeEventListener("click", o.current)
        }
    }, [t, n]), {
        onPointerDownCapture: () => r.current = !0
    }
}

function Uf(e, t = globalThis ?.document) {
    const n = qn(e),
        r = g.useRef(!1);
    return g.useEffect(() => {
        const o = i => {
            i.target && !r.current && $a(Wf, n, {
                originalEvent: i
            }, {
                discrete: !1
            })
        };
        return t.addEventListener("focusin", o), () => t.removeEventListener("focusin", o)
    }, [t, n]), {
        onFocusCapture: () => r.current = !0,
        onBlurCapture: () => r.current = !1
    }
}

function _i() {
    const e = new CustomEvent(eo);
    document.dispatchEvent(e)
}

function $a(e, t, n, {
    discrete: r
}) {
    const o = n.originalEvent.target,
        i = new CustomEvent(e, {
            bubbles: !1,
            cancelable: !0,
            detail: n
        });
    t && o.addEventListener(e, t, {
        once: !0
    }), r ? Lf(o, i) : o.dispatchEvent(i)
}
var qf = Eo[" useId ".trim().toString()] || (() => {}),
    Kf = 0;

function Gf(e) {
    const [t, n] = g.useState(qf());
    return qe(() => {
        n(r => r ?? String(Kf++))
    }, [e]), t ? `radix-${t}` : ""
}
const Yf = ["top", "right", "bottom", "left"],
    Ke = Math.min,
    de = Math.max,
    On = Math.round,
    gn = Math.floor,
    Re = e => ({
        x: e,
        y: e
    }),
    Qf = {
        left: "right",
        right: "left",
        bottom: "top",
        top: "bottom"
    };

function to(e, t, n) {
    return de(e, Ke(t, n))
}

function ze(e, t) {
    return typeof e == "function" ? e(t) : e
}

function We(e) {
    return e.split("-")[0]
}

function St(e) {
    return e.split("-")[1]
}

function Ro(e) {
    return e === "x" ? "y" : "x"
}

function Oo(e) {
    return e === "y" ? "height" : "width"
}

function Te(e) {
    const t = e[0];
    return t === "t" || t === "b" ? "y" : "x"
}

function ko(e) {
    return Ro(Te(e))
}

function Xf(e, t, n) {
    n === void 0 && (n = !1);
    const r = St(e),
        o = ko(e),
        i = Oo(o);
    let s = o === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
    return t.reference[i] > t.floating[i] && (s = kn(s)), [s, kn(s)]
}

function Jf(e) {
    const t = kn(e);
    return [no(e), t, no(t)]
}

function no(e) {
    return e.includes("start") ? e.replace("start", "end") : e.replace("end", "start")
}
const xi = ["left", "right"],
    wi = ["right", "left"],
    Zf = ["top", "bottom"],
    ed = ["bottom", "top"];

function td(e, t, n) {
    switch (e) {
        case "top":
        case "bottom":
            return n ? t ? wi : xi : t ? xi : wi;
        case "left":
        case "right":
            return t ? Zf : ed;
        default:
            return []
    }
}

function nd(e, t, n, r) {
    const o = St(e);
    let i = td(We(e), n === "start", r);
    return o && (i = i.map(s => s + "-" + o), t && (i = i.concat(i.map(no)))), i
}

function kn(e) {
    const t = We(e);
    return Qf[t] + e.slice(t.length)
}

function rd(e) {
    return {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        ...e
    }
}

function Sa(e) {
    return typeof e != "number" ? rd(e) : {
        top: e,
        right: e,
        bottom: e,
        left: e
    }
}

function In(e) {
    const {
        x: t,
        y: n,
        width: r,
        height: o
    } = e;
    return {
        width: r,
        height: o,
        top: n,
        left: t,
        right: t + r,
        bottom: n + o,
        x: t,
        y: n
    }
}

function Ei(e, t, n) {
    let {
        reference: r,
        floating: o
    } = e;
    const i = Te(t),
        s = ko(t),
        a = Oo(s),
        c = We(t),
        l = i === "y",
        u = r.x + r.width / 2 - o.width / 2,
        f = r.y + r.height / 2 - o.height / 2,
        d = r[a] / 2 - o[a] / 2;
    let h;
    switch (c) {
        case "top":
            h = {
                x: u,
                y: r.y - o.height
            };
            break;
        case "bottom":
            h = {
                x: u,
                y: r.y + r.height
            };
            break;
        case "right":
            h = {
                x: r.x + r.width,
                y: f
            };
            break;
        case "left":
            h = {
                x: r.x - o.width,
                y: f
            };
            break;
        default:
            h = {
                x: r.x,
                y: r.y
            }
    }
    switch (St(t)) {
        case "start":
            h[s] -= d * (n && l ? -1 : 1);
            break;
        case "end":
            h[s] += d * (n && l ? -1 : 1);
            break
    }
    return h
}
async function od(e, t) {
    var n;
    t === void 0 && (t = {});
    const {
        x: r,
        y: o,
        platform: i,
        rects: s,
        elements: a,
        strategy: c
    } = e, {
        boundary: l = "clippingAncestors",
        rootBoundary: u = "viewport",
        elementContext: f = "floating",
        altBoundary: d = !1,
        padding: h = 0
    } = ze(t, e), p = Sa(h), v = a[d ? f === "floating" ? "reference" : "floating" : f], b = In(await i.getClippingRect({
        element: (n = await (i.isElement == null ? void 0 : i.isElement(v))) == null || n ? v : v.contextElement || await (i.getDocumentElement == null ? void 0 : i.getDocumentElement(a.floating)),
        boundary: l,
        rootBoundary: u,
        strategy: c
    })), _ = f === "floating" ? {
        x: r,
        y: o,
        width: s.floating.width,
        height: s.floating.height
    } : s.reference, x = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(a.floating)), w = await (i.isElement == null ? void 0 : i.isElement(x)) ? await (i.getScale == null ? void 0 : i.getScale(x)) || {
        x: 1,
        y: 1
    } : {
        x: 1,
        y: 1
    }, C = In(i.convertOffsetParentRelativeRectToViewportRelativeRect ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
        elements: a,
        rect: _,
        offsetParent: x,
        strategy: c
    }) : _);
    return {
        top: (b.top - C.top + p.top) / w.y,
        bottom: (C.bottom - b.bottom + p.bottom) / w.y,
        left: (b.left - C.left + p.left) / w.x,
        right: (C.right - b.right + p.right) / w.x
    }
}
const id = 50,
    sd = async (e, t, n) => {
        const {
            placement: r = "bottom",
            strategy: o = "absolute",
            middleware: i = [],
            platform: s
        } = n, a = s.detectOverflow ? s : { ...s,
            detectOverflow: od
        }, c = await (s.isRTL == null ? void 0 : s.isRTL(t));
        let l = await s.getElementRects({
                reference: e,
                floating: t,
                strategy: o
            }),
            {
                x: u,
                y: f
            } = Ei(l, r, c),
            d = r,
            h = 0;
        const p = {};
        for (let m = 0; m < i.length; m++) {
            const v = i[m];
            if (!v) continue;
            const {
                name: b,
                fn: _
            } = v, {
                x,
                y: w,
                data: C,
                reset: E
            } = await _({
                x: u,
                y: f,
                initialPlacement: r,
                placement: d,
                strategy: o,
                middlewareData: p,
                rects: l,
                platform: a,
                elements: {
                    reference: e,
                    floating: t
                }
            });
            u = x ?? u, f = w ?? f, p[b] = { ...p[b],
                ...C
            }, E && h < id && (h++, typeof E == "object" && (E.placement && (d = E.placement), E.rects && (l = E.rects === !0 ? await s.getElementRects({
                reference: e,
                floating: t,
                strategy: o
            }) : E.rects), {
                x: u,
                y: f
            } = Ei(l, d, c)), m = -1)
        }
        return {
            x: u,
            y: f,
            placement: d,
            strategy: o,
            middlewareData: p
        }
    },
    ad = e => ({
        name: "arrow",
        options: e,
        async fn(t) {
            const {
                x: n,
                y: r,
                placement: o,
                rects: i,
                platform: s,
                elements: a,
                middlewareData: c
            } = t, {
                element: l,
                padding: u = 0
            } = ze(e, t) || {};
            if (l == null) return {};
            const f = Sa(u),
                d = {
                    x: n,
                    y: r
                },
                h = ko(o),
                p = Oo(h),
                m = await s.getDimensions(l),
                v = h === "y",
                b = v ? "top" : "left",
                _ = v ? "bottom" : "right",
                x = v ? "clientHeight" : "clientWidth",
                w = i.reference[p] + i.reference[h] - d[h] - i.floating[p],
                C = d[h] - i.reference[h],
                E = await (s.getOffsetParent == null ? void 0 : s.getOffsetParent(l));
            let S = E ? E[x] : 0;
            (!S || !await (s.isElement == null ? void 0 : s.isElement(E))) && (S = a.floating[x] || i.floating[p]);
            const R = w / 2 - C / 2,
                j = S / 2 - m[p] / 2 - 1,
                T = Ke(f[b], j),
                O = Ke(f[_], j),
                k = T,
                A = S - m[p] - O,
                M = S / 2 - m[p] / 2 + R,
                N = to(k, M, A),
                W = !c.arrow && St(o) != null && M !== N && i.reference[p] / 2 - (M < k ? T : O) - m[p] / 2 < 0,
                V = W ? M < k ? M - k : M - A : 0;
            return {
                [h]: d[h] + V,
                data: {
                    [h]: N,
                    centerOffset: M - N - V,
                    ...W && {
                        alignmentOffset: V
                    }
                },
                reset: W
            }
        }
    }),
    cd = function(e) {
        return e === void 0 && (e = {}), {
            name: "flip",
            options: e,
            async fn(t) {
                var n, r;
                const {
                    placement: o,
                    middlewareData: i,
                    rects: s,
                    initialPlacement: a,
                    platform: c,
                    elements: l
                } = t, {
                    mainAxis: u = !0,
                    crossAxis: f = !0,
                    fallbackPlacements: d,
                    fallbackStrategy: h = "bestFit",
                    fallbackAxisSideDirection: p = "none",
                    flipAlignment: m = !0,
                    ...v
                } = ze(e, t);
                if ((n = i.arrow) != null && n.alignmentOffset) return {};
                const b = We(o),
                    _ = Te(a),
                    x = We(a) === a,
                    w = await (c.isRTL == null ? void 0 : c.isRTL(l.floating)),
                    C = d || (x || !m ? [kn(a)] : Jf(a)),
                    E = p !== "none";
                !d && E && C.push(...nd(a, m, p, w));
                const S = [a, ...C],
                    R = await c.detectOverflow(t, v),
                    j = [];
                let T = ((r = i.flip) == null ? void 0 : r.overflows) || [];
                if (u && j.push(R[b]), f) {
                    const M = Xf(o, s, w);
                    j.push(R[M[0]], R[M[1]])
                }
                if (T = [...T, {
                        placement: o,
                        overflows: j
                    }], !j.every(M => M <= 0)) {
                    var O, k;
                    const M = (((O = i.flip) == null ? void 0 : O.index) || 0) + 1,
                        N = S[M];
                    if (N && (!(f === "alignment" ? _ !== Te(N) : !1) || T.every(I => Te(I.placement) === _ ? I.overflows[0] > 0 : !0))) return {
                        data: {
                            index: M,
                            overflows: T
                        },
                        reset: {
                            placement: N
                        }
                    };
                    let W = (k = T.filter(V => V.overflows[0] <= 0).sort((V, I) => V.overflows[1] - I.overflows[1])[0]) == null ? void 0 : k.placement;
                    if (!W) switch (h) {
                        case "bestFit":
                            {
                                var A;
                                const V = (A = T.filter(I => {
                                    if (E) {
                                        const U = Te(I.placement);
                                        return U === _ || U === "y"
                                    }
                                    return !0
                                }).map(I => [I.placement, I.overflows.filter(U => U > 0).reduce((U, te) => U + te, 0)]).sort((I, U) => I[1] - U[1])[0]) == null ? void 0 : A[0];V && (W = V);
                                break
                            }
                        case "initialPlacement":
                            W = a;
                            break
                    }
                    if (o !== W) return {
                        reset: {
                            placement: W
                        }
                    }
                }
                return {}
            }
        }
    };

function $i(e, t) {
    return {
        top: e.top - t.height,
        right: e.right - t.width,
        bottom: e.bottom - t.height,
        left: e.left - t.width
    }
}

function Si(e) {
    return Yf.some(t => e[t] >= 0)
}
const ld = function(e) {
        return e === void 0 && (e = {}), {
            name: "hide",
            options: e,
            async fn(t) {
                const {
                    rects: n,
                    platform: r
                } = t, {
                    strategy: o = "referenceHidden",
                    ...i
                } = ze(e, t);
                switch (o) {
                    case "referenceHidden":
                        {
                            const s = await r.detectOverflow(t, { ...i,
                                    elementContext: "reference"
                                }),
                                a = $i(s, n.reference);
                            return {
                                data: {
                                    referenceHiddenOffsets: a,
                                    referenceHidden: Si(a)
                                }
                            }
                        }
                    case "escaped":
                        {
                            const s = await r.detectOverflow(t, { ...i,
                                    altBoundary: !0
                                }),
                                a = $i(s, n.floating);
                            return {
                                data: {
                                    escapedOffsets: a,
                                    escaped: Si(a)
                                }
                            }
                        }
                    default:
                        return {}
                }
            }
        }
    },
    Ca = new Set(["left", "top"]);
async function ud(e, t) {
    const {
        placement: n,
        platform: r,
        elements: o
    } = e, i = await (r.isRTL == null ? void 0 : r.isRTL(o.floating)), s = We(n), a = St(n), c = Te(n) === "y", l = Ca.has(s) ? -1 : 1, u = i && c ? -1 : 1, f = ze(t, e);
    let {
        mainAxis: d,
        crossAxis: h,
        alignmentAxis: p
    } = typeof f == "number" ? {
        mainAxis: f,
        crossAxis: 0,
        alignmentAxis: null
    } : {
        mainAxis: f.mainAxis || 0,
        crossAxis: f.crossAxis || 0,
        alignmentAxis: f.alignmentAxis
    };
    return a && typeof p == "number" && (h = a === "end" ? p * -1 : p), c ? {
        x: h * u,
        y: d * l
    } : {
        x: d * l,
        y: h * u
    }
}
const fd = function(e) {
        return e === void 0 && (e = 0), {
            name: "offset",
            options: e,
            async fn(t) {
                var n, r;
                const {
                    x: o,
                    y: i,
                    placement: s,
                    middlewareData: a
                } = t, c = await ud(t, e);
                return s === ((n = a.offset) == null ? void 0 : n.placement) && (r = a.arrow) != null && r.alignmentOffset ? {} : {
                    x: o + c.x,
                    y: i + c.y,
                    data: { ...c,
                        placement: s
                    }
                }
            }
        }
    },
    dd = function(e) {
        return e === void 0 && (e = {}), {
            name: "shift",
            options: e,
            async fn(t) {
                const {
                    x: n,
                    y: r,
                    placement: o,
                    platform: i
                } = t, {
                    mainAxis: s = !0,
                    crossAxis: a = !1,
                    limiter: c = {
                        fn: b => {
                            let {
                                x: _,
                                y: x
                            } = b;
                            return {
                                x: _,
                                y: x
                            }
                        }
                    },
                    ...l
                } = ze(e, t), u = {
                    x: n,
                    y: r
                }, f = await i.detectOverflow(t, l), d = Te(We(o)), h = Ro(d);
                let p = u[h],
                    m = u[d];
                if (s) {
                    const b = h === "y" ? "top" : "left",
                        _ = h === "y" ? "bottom" : "right",
                        x = p + f[b],
                        w = p - f[_];
                    p = to(x, p, w)
                }
                if (a) {
                    const b = d === "y" ? "top" : "left",
                        _ = d === "y" ? "bottom" : "right",
                        x = m + f[b],
                        w = m - f[_];
                    m = to(x, m, w)
                }
                const v = c.fn({ ...t,
                    [h]: p,
                    [d]: m
                });
                return { ...v,
                    data: {
                        x: v.x - n,
                        y: v.y - r,
                        enabled: {
                            [h]: s,
                            [d]: a
                        }
                    }
                }
            }
        }
    },
    hd = function(e) {
        return e === void 0 && (e = {}), {
            options: e,
            fn(t) {
                const {
                    x: n,
                    y: r,
                    placement: o,
                    rects: i,
                    middlewareData: s
                } = t, {
                    offset: a = 0,
                    mainAxis: c = !0,
                    crossAxis: l = !0
                } = ze(e, t), u = {
                    x: n,
                    y: r
                }, f = Te(o), d = Ro(f);
                let h = u[d],
                    p = u[f];
                const m = ze(a, t),
                    v = typeof m == "number" ? {
                        mainAxis: m,
                        crossAxis: 0
                    } : {
                        mainAxis: 0,
                        crossAxis: 0,
                        ...m
                    };
                if (c) {
                    const x = d === "y" ? "height" : "width",
                        w = i.reference[d] - i.floating[x] + v.mainAxis,
                        C = i.reference[d] + i.reference[x] - v.mainAxis;
                    h < w ? h = w : h > C && (h = C)
                }
                if (l) {
                    var b, _;
                    const x = d === "y" ? "width" : "height",
                        w = Ca.has(We(o)),
                        C = i.reference[f] - i.floating[x] + (w && ((b = s.offset) == null ? void 0 : b[f]) || 0) + (w ? 0 : v.crossAxis),
                        E = i.reference[f] + i.reference[x] + (w ? 0 : ((_ = s.offset) == null ? void 0 : _[f]) || 0) - (w ? v.crossAxis : 0);
                    p < C ? p = C : p > E && (p = E)
                }
                return {
                    [d]: h,
                    [f]: p
                }
            }
        }
    },
    pd = function(e) {
        return e === void 0 && (e = {}), {
            name: "size",
            options: e,
            async fn(t) {
                var n, r;
                const {
                    placement: o,
                    rects: i,
                    platform: s,
                    elements: a
                } = t, {
                    apply: c = () => {},
                    ...l
                } = ze(e, t), u = await s.detectOverflow(t, l), f = We(o), d = St(o), h = Te(o) === "y", {
                    width: p,
                    height: m
                } = i.floating;
                let v, b;
                f === "top" || f === "bottom" ? (v = f, b = d === (await (s.isRTL == null ? void 0 : s.isRTL(a.floating)) ? "start" : "end") ? "left" : "right") : (b = f, v = d === "end" ? "top" : "bottom");
                const _ = m - u.top - u.bottom,
                    x = p - u.left - u.right,
                    w = Ke(m - u[v], _),
                    C = Ke(p - u[b], x),
                    E = !t.middlewareData.shift;
                let S = w,
                    R = C;
                if ((n = t.middlewareData.shift) != null && n.enabled.x && (R = x), (r = t.middlewareData.shift) != null && r.enabled.y && (S = _), E && !d) {
                    const T = de(u.left, 0),
                        O = de(u.right, 0),
                        k = de(u.top, 0),
                        A = de(u.bottom, 0);
                    h ? R = p - 2 * (T !== 0 || O !== 0 ? T + O : de(u.left, u.right)) : S = m - 2 * (k !== 0 || A !== 0 ? k + A : de(u.top, u.bottom))
                }
                await c({ ...t,
                    availableWidth: R,
                    availableHeight: S
                });
                const j = await s.getDimensions(a.floating);
                return p !== j.width || m !== j.height ? {
                    reset: {
                        rects: !0
                    }
                } : {}
            }
        }
    };

function Kn() {
    return typeof window < "u"
}

function Ct(e) {
    return Ta(e) ? (e.nodeName || "").toLowerCase() : "#document"
}

function pe(e) {
    var t;
    return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window
}

function Ae(e) {
    var t;
    return (t = (Ta(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement
}

function Ta(e) {
    return Kn() ? e instanceof Node || e instanceof pe(e).Node : !1
}

function we(e) {
    return Kn() ? e instanceof Element || e instanceof pe(e).Element : !1
}

function He(e) {
    return Kn() ? e instanceof HTMLElement || e instanceof pe(e).HTMLElement : !1
}

function Ci(e) {
    return !Kn() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof pe(e).ShadowRoot
}

function Qt(e) {
    const {
        overflow: t,
        overflowX: n,
        overflowY: r,
        display: o
    } = Ee(e);
    return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && o !== "inline" && o !== "contents"
}

function gd(e) {
    return /^(table|td|th)$/.test(Ct(e))
}

function Gn(e) {
    try {
        if (e.matches(":popover-open")) return !0
    } catch {}
    try {
        return e.matches(":modal")
    } catch {
        return !1
    }
}
const md = /transform|translate|scale|rotate|perspective|filter/,
    vd = /paint|layout|strict|content/,
    Xe = e => !!e && e !== "none";
let pr;

function Io(e) {
    const t = we(e) ? Ee(e) : e;
    return Xe(t.transform) || Xe(t.translate) || Xe(t.scale) || Xe(t.rotate) || Xe(t.perspective) || !Po() && (Xe(t.backdropFilter) || Xe(t.filter)) || md.test(t.willChange || "") || vd.test(t.contain || "")
}

function bd(e) {
    let t = Ge(e);
    for (; He(t) && !yt(t);) {
        if (Io(t)) return t;
        if (Gn(t)) return null;
        t = Ge(t)
    }
    return null
}

function Po() {
    return pr == null && (pr = typeof CSS < "u" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none")), pr
}

function yt(e) {
    return /^(html|body|#document)$/.test(Ct(e))
}

function Ee(e) {
    return pe(e).getComputedStyle(e)
}

function Yn(e) {
    return we(e) ? {
        scrollLeft: e.scrollLeft,
        scrollTop: e.scrollTop
    } : {
        scrollLeft: e.scrollX,
        scrollTop: e.scrollY
    }
}

function Ge(e) {
    if (Ct(e) === "html") return e;
    const t = e.assignedSlot || e.parentNode || Ci(e) && e.host || Ae(e);
    return Ci(t) ? t.host : t
}

function Ra(e) {
    const t = Ge(e);
    return yt(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : He(t) && Qt(t) ? t : Ra(t)
}

function Bt(e, t, n) {
    var r;
    t === void 0 && (t = []), n === void 0 && (n = !0);
    const o = Ra(e),
        i = o === ((r = e.ownerDocument) == null ? void 0 : r.body),
        s = pe(o);
    if (i) {
        const a = ro(s);
        return t.concat(s, s.visualViewport || [], Qt(o) ? o : [], a && n ? Bt(a) : [])
    } else return t.concat(o, Bt(o, [], n))
}

function ro(e) {
    return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null
}

function Oa(e) {
    const t = Ee(e);
    let n = parseFloat(t.width) || 0,
        r = parseFloat(t.height) || 0;
    const o = He(e),
        i = o ? e.offsetWidth : n,
        s = o ? e.offsetHeight : r,
        a = On(n) !== i || On(r) !== s;
    return a && (n = i, r = s), {
        width: n,
        height: r,
        $: a
    }
}

function Ao(e) {
    return we(e) ? e : e.contextElement
}

function mt(e) {
    const t = Ao(e);
    if (!He(t)) return Re(1);
    const n = t.getBoundingClientRect(),
        {
            width: r,
            height: o,
            $: i
        } = Oa(t);
    let s = (i ? On(n.width) : n.width) / r,
        a = (i ? On(n.height) : n.height) / o;
    return (!s || !Number.isFinite(s)) && (s = 1), (!a || !Number.isFinite(a)) && (a = 1), {
        x: s,
        y: a
    }
}
const yd = Re(0);

function ka(e) {
    const t = pe(e);
    return !Po() || !t.visualViewport ? yd : {
        x: t.visualViewport.offsetLeft,
        y: t.visualViewport.offsetTop
    }
}

function _d(e, t, n) {
    return t === void 0 && (t = !1), !n || t && n !== pe(e) ? !1 : t
}

function nt(e, t, n, r) {
    t === void 0 && (t = !1), n === void 0 && (n = !1);
    const o = e.getBoundingClientRect(),
        i = Ao(e);
    let s = Re(1);
    t && (r ? we(r) && (s = mt(r)) : s = mt(e));
    const a = _d(i, n, r) ? ka(i) : Re(0);
    let c = (o.left + a.x) / s.x,
        l = (o.top + a.y) / s.y,
        u = o.width / s.x,
        f = o.height / s.y;
    if (i) {
        const d = pe(i),
            h = r && we(r) ? pe(r) : r;
        let p = d,
            m = ro(p);
        for (; m && r && h !== p;) {
            const v = mt(m),
                b = m.getBoundingClientRect(),
                _ = Ee(m),
                x = b.left + (m.clientLeft + parseFloat(_.paddingLeft)) * v.x,
                w = b.top + (m.clientTop + parseFloat(_.paddingTop)) * v.y;
            c *= v.x, l *= v.y, u *= v.x, f *= v.y, c += x, l += w, p = pe(m), m = ro(p)
        }
    }
    return In({
        width: u,
        height: f,
        x: c,
        y: l
    })
}

function Qn(e, t) {
    const n = Yn(e).scrollLeft;
    return t ? t.left + n : nt(Ae(e)).left + n
}

function Ia(e, t) {
    const n = e.getBoundingClientRect(),
        r = n.left + t.scrollLeft - Qn(e, n),
        o = n.top + t.scrollTop;
    return {
        x: r,
        y: o
    }
}

function xd(e) {
    let {
        elements: t,
        rect: n,
        offsetParent: r,
        strategy: o
    } = e;
    const i = o === "fixed",
        s = Ae(r),
        a = t ? Gn(t.floating) : !1;
    if (r === s || a && i) return n;
    let c = {
            scrollLeft: 0,
            scrollTop: 0
        },
        l = Re(1);
    const u = Re(0),
        f = He(r);
    if ((f || !f && !i) && ((Ct(r) !== "body" || Qt(s)) && (c = Yn(r)), f)) {
        const h = nt(r);
        l = mt(r), u.x = h.x + r.clientLeft, u.y = h.y + r.clientTop
    }
    const d = s && !f && !i ? Ia(s, c) : Re(0);
    return {
        width: n.width * l.x,
        height: n.height * l.y,
        x: n.x * l.x - c.scrollLeft * l.x + u.x + d.x,
        y: n.y * l.y - c.scrollTop * l.y + u.y + d.y
    }
}

function wd(e) {
    return Array.from(e.getClientRects())
}

function Ed(e) {
    const t = Ae(e),
        n = Yn(e),
        r = e.ownerDocument.body,
        o = de(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth),
        i = de(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
    let s = -n.scrollLeft + Qn(e);
    const a = -n.scrollTop;
    return Ee(r).direction === "rtl" && (s += de(t.clientWidth, r.clientWidth) - o), {
        width: o,
        height: i,
        x: s,
        y: a
    }
}
const Ti = 25;

function $d(e, t) {
    const n = pe(e),
        r = Ae(e),
        o = n.visualViewport;
    let i = r.clientWidth,
        s = r.clientHeight,
        a = 0,
        c = 0;
    if (o) {
        i = o.width, s = o.height;
        const u = Po();
        (!u || u && t === "fixed") && (a = o.offsetLeft, c = o.offsetTop)
    }
    const l = Qn(r);
    if (l <= 0) {
        const u = r.ownerDocument,
            f = u.body,
            d = getComputedStyle(f),
            h = u.compatMode === "CSS1Compat" && parseFloat(d.marginLeft) + parseFloat(d.marginRight) || 0,
            p = Math.abs(r.clientWidth - f.clientWidth - h);
        p <= Ti && (i -= p)
    } else l <= Ti && (i += l);
    return {
        width: i,
        height: s,
        x: a,
        y: c
    }
}

function Sd(e, t) {
    const n = nt(e, !0, t === "fixed"),
        r = n.top + e.clientTop,
        o = n.left + e.clientLeft,
        i = He(e) ? mt(e) : Re(1),
        s = e.clientWidth * i.x,
        a = e.clientHeight * i.y,
        c = o * i.x,
        l = r * i.y;
    return {
        width: s,
        height: a,
        x: c,
        y: l
    }
}

function Ri(e, t, n) {
    let r;
    if (t === "viewport") r = $d(e, n);
    else if (t === "document") r = Ed(Ae(e));
    else if (we(t)) r = Sd(t, n);
    else {
        const o = ka(e);
        r = {
            x: t.x - o.x,
            y: t.y - o.y,
            width: t.width,
            height: t.height
        }
    }
    return In(r)
}

function Pa(e, t) {
    const n = Ge(e);
    return n === t || !we(n) || yt(n) ? !1 : Ee(n).position === "fixed" || Pa(n, t)
}

function Cd(e, t) {
    const n = t.get(e);
    if (n) return n;
    let r = Bt(e, [], !1).filter(a => we(a) && Ct(a) !== "body"),
        o = null;
    const i = Ee(e).position === "fixed";
    let s = i ? Ge(e) : e;
    for (; we(s) && !yt(s);) {
        const a = Ee(s),
            c = Io(s);
        !c && a.position === "fixed" && (o = null), (i ? !c && !o : !c && a.position === "static" && !!o && (o.position === "absolute" || o.position === "fixed") || Qt(s) && !c && Pa(e, s)) ? r = r.filter(u => u !== s) : o = a, s = Ge(s)
    }
    return t.set(e, r), r
}

function Td(e) {
    let {
        element: t,
        boundary: n,
        rootBoundary: r,
        strategy: o
    } = e;
    const s = [...n === "clippingAncestors" ? Gn(t) ? [] : Cd(t, this._c) : [].concat(n), r],
        a = Ri(t, s[0], o);
    let c = a.top,
        l = a.right,
        u = a.bottom,
        f = a.left;
    for (let d = 1; d < s.length; d++) {
        const h = Ri(t, s[d], o);
        c = de(h.top, c), l = Ke(h.right, l), u = Ke(h.bottom, u), f = de(h.left, f)
    }
    return {
        width: l - f,
        height: u - c,
        x: f,
        y: c
    }
}

function Rd(e) {
    const {
        width: t,
        height: n
    } = Oa(e);
    return {
        width: t,
        height: n
    }
}

function Od(e, t, n) {
    const r = He(t),
        o = Ae(t),
        i = n === "fixed",
        s = nt(e, !0, i, t);
    let a = {
        scrollLeft: 0,
        scrollTop: 0
    };
    const c = Re(0);

    function l() {
        c.x = Qn(o)
    }
    if (r || !r && !i)
        if ((Ct(t) !== "body" || Qt(o)) && (a = Yn(t)), r) {
            const h = nt(t, !0, i, t);
            c.x = h.x + t.clientLeft, c.y = h.y + t.clientTop
        } else o && l();
    i && !r && o && l();
    const u = o && !r && !i ? Ia(o, a) : Re(0),
        f = s.left + a.scrollLeft - c.x - u.x,
        d = s.top + a.scrollTop - c.y - u.y;
    return {
        x: f,
        y: d,
        width: s.width,
        height: s.height
    }
}

function gr(e) {
    return Ee(e).position === "static"
}

function Oi(e, t) {
    if (!He(e) || Ee(e).position === "fixed") return null;
    if (t) return t(e);
    let n = e.offsetParent;
    return Ae(e) === n && (n = n.ownerDocument.body), n
}

function Aa(e, t) {
    const n = pe(e);
    if (Gn(e)) return n;
    if (!He(e)) {
        let o = Ge(e);
        for (; o && !yt(o);) {
            if (we(o) && !gr(o)) return o;
            o = Ge(o)
        }
        return n
    }
    let r = Oi(e, t);
    for (; r && gd(r) && gr(r);) r = Oi(r, t);
    return r && yt(r) && gr(r) && !Io(r) ? n : r || bd(e) || n
}
const kd = async function(e) {
    const t = this.getOffsetParent || Aa,
        n = this.getDimensions,
        r = await n(e.floating);
    return {
        reference: Od(e.reference, await t(e.floating), e.strategy),
        floating: {
            x: 0,
            y: 0,
            width: r.width,
            height: r.height
        }
    }
};

function Id(e) {
    return Ee(e).direction === "rtl"
}
const Pd = {
    convertOffsetParentRelativeRectToViewportRelativeRect: xd,
    getDocumentElement: Ae,
    getClippingRect: Td,
    getOffsetParent: Aa,
    getElementRects: kd,
    getClientRects: wd,
    getDimensions: Rd,
    getScale: mt,
    isElement: we,
    isRTL: Id
};

function Da(e, t) {
    return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height
}

function Ad(e, t) {
    let n = null,
        r;
    const o = Ae(e);

    function i() {
        var a;
        clearTimeout(r), (a = n) == null || a.disconnect(), n = null
    }

    function s(a, c) {
        a === void 0 && (a = !1), c === void 0 && (c = 1), i();
        const l = e.getBoundingClientRect(),
            {
                left: u,
                top: f,
                width: d,
                height: h
            } = l;
        if (a || t(), !d || !h) return;
        const p = gn(f),
            m = gn(o.clientWidth - (u + d)),
            v = gn(o.clientHeight - (f + h)),
            b = gn(u),
            x = {
                rootMargin: -p + "px " + -m + "px " + -v + "px " + -b + "px",
                threshold: de(0, Ke(1, c)) || 1
            };
        let w = !0;

        function C(E) {
            const S = E[0].intersectionRatio;
            if (S !== c) {
                if (!w) return s();
                S ? s(!1, S) : r = setTimeout(() => {
                    s(!1, 1e-7)
                }, 1e3)
            }
            S === 1 && !Da(l, e.getBoundingClientRect()) && s(), w = !1
        }
        try {
            n = new IntersectionObserver(C, { ...x,
                root: o.ownerDocument
            })
        } catch {
            n = new IntersectionObserver(C, x)
        }
        n.observe(e)
    }
    return s(!0), i
}

function Dd(e, t, n, r) {
    r === void 0 && (r = {});
    const {
        ancestorScroll: o = !0,
        ancestorResize: i = !0,
        elementResize: s = typeof ResizeObserver == "function",
        layoutShift: a = typeof IntersectionObserver == "function",
        animationFrame: c = !1
    } = r, l = Ao(e), u = o || i ? [...l ? Bt(l) : [], ...t ? Bt(t) : []] : [];
    u.forEach(b => {
        o && b.addEventListener("scroll", n, {
            passive: !0
        }), i && b.addEventListener("resize", n)
    });
    const f = l && a ? Ad(l, n) : null;
    let d = -1,
        h = null;
    s && (h = new ResizeObserver(b => {
        let [_] = b;
        _ && _.target === l && h && t && (h.unobserve(t), cancelAnimationFrame(d), d = requestAnimationFrame(() => {
            var x;
            (x = h) == null || x.observe(t)
        })), n()
    }), l && !c && h.observe(l), t && h.observe(t));
    let p, m = c ? nt(e) : null;
    c && v();

    function v() {
        const b = nt(e);
        m && !Da(m, b) && n(), m = b, p = requestAnimationFrame(v)
    }
    return n(), () => {
        var b;
        u.forEach(_ => {
            o && _.removeEventListener("scroll", n), i && _.removeEventListener("resize", n)
        }), f ?.(), (b = h) == null || b.disconnect(), h = null, c && cancelAnimationFrame(p)
    }
}
const Md = fd,
    jd = dd,
    Ld = cd,
    Nd = pd,
    Fd = ld,
    ki = ad,
    zd = hd,
    Wd = (e, t, n) => {
        const r = new Map,
            o = {
                platform: Pd,
                ...n
            },
            i = { ...o.platform,
                _c: r
            };
        return sd(e, t, { ...o,
            platform: i
        })
    };
var Bd = typeof document < "u",
    Hd = function() {},
    En = Bd ? g.useLayoutEffect : Hd;

function Pn(e, t) {
    if (e === t) return !0;
    if (typeof e != typeof t) return !1;
    if (typeof e == "function" && e.toString() === t.toString()) return !0;
    let n, r, o;
    if (e && t && typeof e == "object") {
        if (Array.isArray(e)) {
            if (n = e.length, n !== t.length) return !1;
            for (r = n; r-- !== 0;)
                if (!Pn(e[r], t[r])) return !1;
            return !0
        }
        if (o = Object.keys(e), n = o.length, n !== Object.keys(t).length) return !1;
        for (r = n; r-- !== 0;)
            if (!{}.hasOwnProperty.call(t, o[r])) return !1;
        for (r = n; r-- !== 0;) {
            const i = o[r];
            if (!(i === "_owner" && e.$$typeof) && !Pn(e[i], t[i])) return !1
        }
        return !0
    }
    return e !== e && t !== t
}

function Ma(e) {
    return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1
}

function Ii(e, t) {
    const n = Ma(e);
    return Math.round(t * n) / n
}

function mr(e) {
    const t = g.useRef(e);
    return En(() => {
        t.current = e
    }), t
}

function Vd(e) {
    e === void 0 && (e = {});
    const {
        placement: t = "bottom",
        strategy: n = "absolute",
        middleware: r = [],
        platform: o,
        elements: {
            reference: i,
            floating: s
        } = {},
        transform: a = !0,
        whileElementsMounted: c,
        open: l
    } = e, [u, f] = g.useState({
        x: 0,
        y: 0,
        strategy: n,
        placement: t,
        middlewareData: {},
        isPositioned: !1
    }), [d, h] = g.useState(r);
    Pn(d, r) || h(r);
    const [p, m] = g.useState(null), [v, b] = g.useState(null), _ = g.useCallback(I => {
        I !== E.current && (E.current = I, m(I))
    }, []), x = g.useCallback(I => {
        I !== S.current && (S.current = I, b(I))
    }, []), w = i || p, C = s || v, E = g.useRef(null), S = g.useRef(null), R = g.useRef(u), j = c != null, T = mr(c), O = mr(o), k = mr(l), A = g.useCallback(() => {
        if (!E.current || !S.current) return;
        const I = {
            placement: t,
            strategy: n,
            middleware: d
        };
        O.current && (I.platform = O.current), Wd(E.current, S.current, I).then(U => {
            const te = { ...U,
                isPositioned: k.current !== !1
            };
            M.current && !Pn(R.current, te) && (R.current = te, Js.flushSync(() => {
                f(te)
            }))
        })
    }, [d, t, n, O, k]);
    En(() => {
        l === !1 && R.current.isPositioned && (R.current.isPositioned = !1, f(I => ({ ...I,
            isPositioned: !1
        })))
    }, [l]);
    const M = g.useRef(!1);
    En(() => (M.current = !0, () => {
        M.current = !1
    }), []), En(() => {
        if (w && (E.current = w), C && (S.current = C), w && C) {
            if (T.current) return T.current(w, C, A);
            A()
        }
    }, [w, C, A, T, j]);
    const N = g.useMemo(() => ({
            reference: E,
            floating: S,
            setReference: _,
            setFloating: x
        }), [_, x]),
        W = g.useMemo(() => ({
            reference: w,
            floating: C
        }), [w, C]),
        V = g.useMemo(() => {
            const I = {
                position: n,
                left: 0,
                top: 0
            };
            if (!W.floating) return I;
            const U = Ii(W.floating, u.x),
                te = Ii(W.floating, u.y);
            return a ? { ...I,
                transform: "translate(" + U + "px, " + te + "px)",
                ...Ma(W.floating) >= 1.5 && {
                    willChange: "transform"
                }
            } : {
                position: n,
                left: U,
                top: te
            }
        }, [n, a, W.floating, u.x, u.y]);
    return g.useMemo(() => ({ ...u,
        update: A,
        refs: N,
        elements: W,
        floatingStyles: V
    }), [u, A, N, W, V])
}
const Ud = e => {
        function t(n) {
            return {}.hasOwnProperty.call(n, "current")
        }
        return {
            name: "arrow",
            options: e,
            fn(n) {
                const {
                    element: r,
                    padding: o
                } = typeof e == "function" ? e(n) : e;
                return r && t(r) ? r.current != null ? ki({
                    element: r.current,
                    padding: o
                }).fn(n) : {} : r ? ki({
                    element: r,
                    padding: o
                }).fn(n) : {}
            }
        }
    },
    qd = (e, t) => {
        const n = Md(e);
        return {
            name: n.name,
            fn: n.fn,
            options: [e, t]
        }
    },
    Kd = (e, t) => {
        const n = jd(e);
        return {
            name: n.name,
            fn: n.fn,
            options: [e, t]
        }
    },
    Gd = (e, t) => ({
        fn: zd(e).fn,
        options: [e, t]
    }),
    Yd = (e, t) => {
        const n = Ld(e);
        return {
            name: n.name,
            fn: n.fn,
            options: [e, t]
        }
    },
    Qd = (e, t) => {
        const n = Nd(e);
        return {
            name: n.name,
            fn: n.fn,
            options: [e, t]
        }
    },
    Xd = (e, t) => {
        const n = Fd(e);
        return {
            name: n.name,
            fn: n.fn,
            options: [e, t]
        }
    },
    Jd = (e, t) => {
        const n = Ud(e);
        return {
            name: n.name,
            fn: n.fn,
            options: [e, t]
        }
    };
var Zd = ["a", "button", "div", "form", "h2", "h3", "img", "input", "label", "li", "nav", "ol", "p", "select", "span", "svg", "ul"],
    eh = Zd.reduce((e, t) => {
        const n = Yt(`Primitive.${t}`),
            r = g.forwardRef((o, i) => {
                const {
                    asChild: s,
                    ...a
                } = o, c = s ? n : t;
                return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), H.jsx(c, { ...a,
                    ref: i
                })
            });
        return r.displayName = `Primitive.${t}`, { ...e,
            [t]: r
        }
    }, {}),
    th = "Arrow",
    ja = g.forwardRef((e, t) => {
        const {
            children: n,
            width: r = 10,
            height: o = 5,
            ...i
        } = e;
        return H.jsx(eh.svg, { ...i,
            ref: t,
            width: r,
            height: o,
            viewBox: "0 0 30 10",
            preserveAspectRatio: "none",
            children: e.asChild ? n : H.jsx("polygon", {
                points: "0,0 30,0 15,10"
            })
        })
    });
ja.displayName = th;
var nh = ja,
    rh = ["a", "button", "div", "form", "h2", "h3", "img", "input", "label", "li", "nav", "ol", "p", "select", "span", "svg", "ul"],
    La = rh.reduce((e, t) => {
        const n = Yt(`Primitive.${t}`),
            r = g.forwardRef((o, i) => {
                const {
                    asChild: s,
                    ...a
                } = o, c = s ? n : t;
                return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), H.jsx(c, { ...a,
                    ref: i
                })
            });
        return r.displayName = `Primitive.${t}`, { ...e,
            [t]: r
        }
    }, {});

function oh(e) {
    const [t, n] = g.useState(void 0);
    return qe(() => {
        if (e) {
            n({
                width: e.offsetWidth,
                height: e.offsetHeight
            });
            const r = new ResizeObserver(o => {
                if (!Array.isArray(o) || !o.length) return;
                const i = o[0];
                let s, a;
                if ("borderBoxSize" in i) {
                    const c = i.borderBoxSize,
                        l = Array.isArray(c) ? c[0] : c;
                    s = l.inlineSize, a = l.blockSize
                } else s = e.offsetWidth, a = e.offsetHeight;
                n({
                    width: s,
                    height: a
                })
            });
            return r.observe(e, {
                box: "border-box"
            }), () => r.unobserve(e)
        } else n(void 0)
    }, [e]), t
}
var Do = "Popper",
    [Na, Fa] = ya(Do),
    [ih, za] = Na(Do),
    Wa = e => {
        const {
            __scopePopper: t,
            children: n
        } = e, [r, o] = g.useState(null);
        return H.jsx(ih, {
            scope: t,
            anchor: r,
            onAnchorChange: o,
            children: n
        })
    };
Wa.displayName = Do;
var Ba = "PopperAnchor",
    Ha = g.forwardRef((e, t) => {
        const {
            __scopePopper: n,
            virtualRef: r,
            ...o
        } = e, i = za(Ba, n), s = g.useRef(null), a = ot(t, s), c = g.useRef(null);
        return g.useEffect(() => {
            const l = c.current;
            c.current = r ?.current || s.current, l !== c.current && i.onAnchorChange(c.current)
        }), r ? null : H.jsx(La.div, { ...o,
            ref: a
        })
    });
Ha.displayName = Ba;
var Mo = "PopperContent",
    [sh, ah] = Na(Mo),
    Va = g.forwardRef((e, t) => {
        const {
            __scopePopper: n,
            side: r = "bottom",
            sideOffset: o = 0,
            align: i = "center",
            alignOffset: s = 0,
            arrowPadding: a = 0,
            avoidCollisions: c = !0,
            collisionBoundary: l = [],
            collisionPadding: u = 0,
            sticky: f = "partial",
            hideWhenDetached: d = !1,
            updatePositionStrategy: h = "optimized",
            onPlaced: p,
            ...m
        } = e, v = za(Mo, n), [b, _] = g.useState(null), x = ot(t, Se => _(Se)), [w, C] = g.useState(null), E = oh(w), S = E ?.width ?? 0, R = E ?.height ?? 0, j = r + (i !== "center" ? "-" + i : ""), T = typeof u == "number" ? u : {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            ...u
        }, O = Array.isArray(l) ? l : [l], k = O.length > 0, A = {
            padding: T,
            boundary: O.filter(lh),
            altBoundary: k
        }, {
            refs: M,
            floatingStyles: N,
            placement: W,
            isPositioned: V,
            middlewareData: I
        } = Vd({
            strategy: "fixed",
            placement: j,
            whileElementsMounted: (...Se) => Dd(...Se, {
                animationFrame: h === "always"
            }),
            elements: {
                reference: v.anchor
            },
            middleware: [qd({
                mainAxis: o + R,
                alignmentAxis: s
            }), c && Kd({
                mainAxis: !0,
                crossAxis: !1,
                limiter: f === "partial" ? Gd() : void 0,
                ...A
            }), c && Yd({ ...A
            }), Qd({ ...A,
                apply: ({
                    elements: Se,
                    rects: De,
                    availableWidth: an,
                    availableHeight: cn
                }) => {
                    const {
                        width: ln,
                        height: un
                    } = De.reference, _e = Se.floating.style;
                    _e.setProperty("--radix-popper-available-width", `${an}px`), _e.setProperty("--radix-popper-available-height", `${cn}px`), _e.setProperty("--radix-popper-anchor-width", `${ln}px`), _e.setProperty("--radix-popper-anchor-height", `${un}px`)
                }
            }), w && Jd({
                element: w,
                padding: a
            }), uh({
                arrowWidth: S,
                arrowHeight: R
            }), d && Xd({
                strategy: "referenceHidden",
                ...A
            })]
        }), [U, te] = Ka(W), me = qn(p);
        qe(() => {
            V && me ?.()
        }, [V, me]);
        const nn = I.arrow ?.x,
            rn = I.arrow ?.y,
            on = I.arrow ?.centerOffset !== 0,
            [sn, st] = g.useState();
        return qe(() => {
            b && st(window.getComputedStyle(b).zIndex)
        }, [b]), H.jsx("div", {
            ref: M.setFloating,
            "data-radix-popper-content-wrapper": "",
            style: { ...N,
                transform: V ? N.transform : "translate(0, -200%)",
                minWidth: "max-content",
                zIndex: sn,
                "--radix-popper-transform-origin": [I.transformOrigin ?.x, I.transformOrigin ?.y].join(" "),
                ...I.hide ?.referenceHidden && {
                    visibility: "hidden",
                    pointerEvents: "none"
                }
            },
            dir: e.dir,
            children: H.jsx(sh, {
                scope: n,
                placedSide: U,
                onArrowChange: C,
                arrowX: nn,
                arrowY: rn,
                shouldHideArrow: on,
                children: H.jsx(La.div, {
                    "data-side": U,
                    "data-align": te,
                    ...m,
                    ref: x,
                    style: { ...m.style,
                        animation: V ? void 0 : "none"
                    }
                })
            })
        })
    });
Va.displayName = Mo;
var Ua = "PopperArrow",
    ch = {
        top: "bottom",
        right: "left",
        bottom: "top",
        left: "right"
    },
    qa = g.forwardRef(function(t, n) {
        const {
            __scopePopper: r,
            ...o
        } = t, i = ah(Ua, r), s = ch[i.placedSide];
        return H.jsx("span", {
            ref: i.onArrowChange,
            style: {
                position: "absolute",
                left: i.arrowX,
                top: i.arrowY,
                [s]: 0,
                transformOrigin: {
                    top: "",
                    right: "0 0",
                    bottom: "center 0",
                    left: "100% 0"
                }[i.placedSide],
                transform: {
                    top: "translateY(100%)",
                    right: "translateY(50%) rotate(90deg) translateX(-50%)",
                    bottom: "rotate(180deg)",
                    left: "translateY(50%) rotate(-90deg) translateX(50%)"
                }[i.placedSide],
                visibility: i.shouldHideArrow ? "hidden" : void 0
            },
            children: H.jsx(nh, { ...o,
                ref: n,
                style: { ...o.style,
                    display: "block"
                }
            })
        })
    });
qa.displayName = Ua;

function lh(e) {
    return e !== null
}
var uh = e => ({
    name: "transformOrigin",
    options: e,
    fn(t) {
        const {
            placement: n,
            rects: r,
            middlewareData: o
        } = t, s = o.arrow ?.centerOffset !== 0, a = s ? 0 : e.arrowWidth, c = s ? 0 : e.arrowHeight, [l, u] = Ka(n), f = {
            start: "0%",
            center: "50%",
            end: "100%"
        }[u], d = (o.arrow ?.x ?? 0) + a / 2, h = (o.arrow ?.y ?? 0) + c / 2;
        let p = "",
            m = "";
        return l === "bottom" ? (p = s ? f : `${d}px`, m = `${-c}px`) : l === "top" ? (p = s ? f : `${d}px`, m = `${r.floating.height+c}px`) : l === "right" ? (p = `${-c}px`, m = s ? f : `${h}px`) : l === "left" && (p = `${r.floating.width+c}px`, m = s ? f : `${h}px`), {
            data: {
                x: p,
                y: m
            }
        }
    }
});

function Ka(e) {
    const [t, n = "center"] = e.split("-");
    return [t, n]
}
var fh = Wa,
    dh = Ha,
    hh = Va,
    ph = qa,
    gh = ["a", "button", "div", "form", "h2", "h3", "img", "input", "label", "li", "nav", "ol", "p", "select", "span", "svg", "ul"],
    mh = gh.reduce((e, t) => {
        const n = Yt(`Primitive.${t}`),
            r = g.forwardRef((o, i) => {
                const {
                    asChild: s,
                    ...a
                } = o, c = s ? n : t;
                return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), H.jsx(c, { ...a,
                    ref: i
                })
            });
        return r.displayName = `Primitive.${t}`, { ...e,
            [t]: r
        }
    }, {});

function vh(e, t) {
    return g.useReducer((n, r) => t[n][r] ?? n, e)
}
var Ga = e => {
    const {
        present: t,
        children: n
    } = e, r = bh(t), o = typeof n == "function" ? n({
        present: r.isPresent
    }) : g.Children.only(n), i = ot(r.ref, yh(o));
    return typeof n == "function" || r.isPresent ? g.cloneElement(o, {
        ref: i
    }) : null
};
Ga.displayName = "Presence";

function bh(e) {
    const [t, n] = g.useState(), r = g.useRef(null), o = g.useRef(e), i = g.useRef("none"), s = e ? "mounted" : "unmounted", [a, c] = vh(s, {
        mounted: {
            UNMOUNT: "unmounted",
            ANIMATION_OUT: "unmountSuspended"
        },
        unmountSuspended: {
            MOUNT: "mounted",
            ANIMATION_END: "unmounted"
        },
        unmounted: {
            MOUNT: "mounted"
        }
    });
    return g.useEffect(() => {
        const l = mn(r.current);
        i.current = a === "mounted" ? l : "none"
    }, [a]), qe(() => {
        const l = r.current,
            u = o.current;
        if (u !== e) {
            const d = i.current,
                h = mn(l);
            e ? c("MOUNT") : h === "none" || l ?.display === "none" ? c("UNMOUNT") : c(u && d !== h ? "ANIMATION_OUT" : "UNMOUNT"), o.current = e
        }
    }, [e, c]), qe(() => {
        if (t) {
            let l;
            const u = t.ownerDocument.defaultView ?? window,
                f = h => {
                    const m = mn(r.current).includes(CSS.escape(h.animationName));
                    if (h.target === t && m && (c("ANIMATION_END"), !o.current)) {
                        const v = t.style.animationFillMode;
                        t.style.animationFillMode = "forwards", l = u.setTimeout(() => {
                            t.style.animationFillMode === "forwards" && (t.style.animationFillMode = v)
                        })
                    }
                },
                d = h => {
                    h.target === t && (i.current = mn(r.current))
                };
            return t.addEventListener("animationstart", d), t.addEventListener("animationcancel", f), t.addEventListener("animationend", f), () => {
                u.clearTimeout(l), t.removeEventListener("animationstart", d), t.removeEventListener("animationcancel", f), t.removeEventListener("animationend", f)
            }
        } else c("ANIMATION_END")
    }, [t, c]), {
        isPresent: ["mounted", "unmountSuspended"].includes(a),
        ref: g.useCallback(l => {
            r.current = l ? getComputedStyle(l) : null, n(l)
        }, [])
    }
}

function mn(e) {
    return e ?.animationName || "none"
}

function yh(e) {
    let t = Object.getOwnPropertyDescriptor(e.props, "ref") ?.get,
        n = t && "isReactWarning" in t && t.isReactWarning;
    return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref") ?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref)
}
var _h = Eo[" useInsertionEffect ".trim().toString()] || qe;

function xh({
    prop: e,
    defaultProp: t,
    onChange: n = () => {},
    caller: r
}) {
    const [o, i, s] = wh({
        defaultProp: t,
        onChange: n
    }), a = e !== void 0, c = a ? e : o; {
        const u = g.useRef(e !== void 0);
        g.useEffect(() => {
            const f = u.current;
            f !== a && console.warn(`${r} is changing from ${f?"controlled":"uncontrolled"} to ${a?"controlled":"uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`), u.current = a
        }, [a, r])
    }
    const l = g.useCallback(u => {
        if (a) {
            const f = Eh(u) ? u(e) : u;
            f !== e && s.current ?.(f)
        } else i(u)
    }, [a, e, i, s]);
    return [c, l]
}

function wh({
    defaultProp: e,
    onChange: t
}) {
    const [n, r] = g.useState(e), o = g.useRef(n), i = g.useRef(t);
    return _h(() => {
        i.current = t
    }, [t]), g.useEffect(() => {
        o.current !== n && (i.current ?.(n), o.current = n)
    }, [n, o]), [n, r, i]
}

function Eh(e) {
    return typeof e == "function"
}
var $h = ["a", "button", "div", "form", "h2", "h3", "img", "input", "label", "li", "nav", "ol", "p", "select", "span", "svg", "ul"],
    Sh = $h.reduce((e, t) => {
        const n = Yt(`Primitive.${t}`),
            r = g.forwardRef((o, i) => {
                const {
                    asChild: s,
                    ...a
                } = o, c = s ? n : t;
                return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), H.jsx(c, { ...a,
                    ref: i
                })
            });
        return r.displayName = `Primitive.${t}`, { ...e,
            [t]: r
        }
    }, {}),
    Ch = Object.freeze({
        position: "absolute",
        border: 0,
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        wordWrap: "normal"
    }),
    Th = "VisuallyHidden",
    Ya = g.forwardRef((e, t) => H.jsx(Sh.span, { ...e,
        ref: t,
        style: { ...Ch,
            ...e.style
        }
    }));
Ya.displayName = Th;
var Rh = Ya,
    [Xn] = ya("Tooltip", [Fa]),
    Jn = Fa(),
    Qa = "TooltipProvider",
    Oh = 700,
    oo = "tooltip.open",
    [kh, jo] = Xn(Qa),
    Xa = e => {
        const {
            __scopeTooltip: t,
            delayDuration: n = Oh,
            skipDelayDuration: r = 300,
            disableHoverableContent: o = !1,
            children: i
        } = e, s = g.useRef(!0), a = g.useRef(!1), c = g.useRef(0);
        return g.useEffect(() => {
            const l = c.current;
            return () => window.clearTimeout(l)
        }, []), H.jsx(kh, {
            scope: t,
            isOpenDelayedRef: s,
            delayDuration: n,
            onOpen: g.useCallback(() => {
                window.clearTimeout(c.current), s.current = !1
            }, []),
            onClose: g.useCallback(() => {
                window.clearTimeout(c.current), c.current = window.setTimeout(() => s.current = !0, r)
            }, [r]),
            isPointerInTransitRef: a,
            onPointerInTransitChange: g.useCallback(l => {
                a.current = l
            }, []),
            disableHoverableContent: o,
            children: i
        })
    };
Xa.displayName = Qa;
var Ht = "Tooltip",
    [Ih, Zn] = Xn(Ht),
    Ja = e => {
        const {
            __scopeTooltip: t,
            children: n,
            open: r,
            defaultOpen: o,
            onOpenChange: i,
            disableHoverableContent: s,
            delayDuration: a
        } = e, c = jo(Ht, e.__scopeTooltip), l = Jn(t), [u, f] = g.useState(null), d = Gf(), h = g.useRef(0), p = s ?? c.disableHoverableContent, m = a ?? c.delayDuration, v = g.useRef(!1), [b, _] = xh({
            prop: r,
            defaultProp: o ?? !1,
            onChange: S => {
                S ? (c.onOpen(), document.dispatchEvent(new CustomEvent(oo))) : c.onClose(), i ?.(S)
            },
            caller: Ht
        }), x = g.useMemo(() => b ? v.current ? "delayed-open" : "instant-open" : "closed", [b]), w = g.useCallback(() => {
            window.clearTimeout(h.current), h.current = 0, v.current = !1, _(!0)
        }, [_]), C = g.useCallback(() => {
            window.clearTimeout(h.current), h.current = 0, _(!1)
        }, [_]), E = g.useCallback(() => {
            window.clearTimeout(h.current), h.current = window.setTimeout(() => {
                v.current = !0, _(!0), h.current = 0
            }, m)
        }, [m, _]);
        return g.useEffect(() => () => {
            h.current && (window.clearTimeout(h.current), h.current = 0)
        }, []), H.jsx(fh, { ...l,
            children: H.jsx(Ih, {
                scope: t,
                contentId: d,
                open: b,
                stateAttribute: x,
                trigger: u,
                onTriggerChange: f,
                onTriggerEnter: g.useCallback(() => {
                    c.isOpenDelayedRef.current ? E() : w()
                }, [c.isOpenDelayedRef, E, w]),
                onTriggerLeave: g.useCallback(() => {
                    p ? C() : (window.clearTimeout(h.current), h.current = 0)
                }, [C, p]),
                onOpen: w,
                onClose: C,
                disableHoverableContent: p,
                children: n
            })
        })
    };
Ja.displayName = Ht;
var io = "TooltipTrigger",
    Za = g.forwardRef((e, t) => {
        const {
            __scopeTooltip: n,
            ...r
        } = e, o = Zn(io, n), i = jo(io, n), s = Jn(n), a = g.useRef(null), c = ot(t, a, o.onTriggerChange), l = g.useRef(!1), u = g.useRef(!1), f = g.useCallback(() => l.current = !1, []);
        return g.useEffect(() => () => document.removeEventListener("pointerup", f), [f]), H.jsx(dh, {
            asChild: !0,
            ...s,
            children: H.jsx(mh.button, {
                "aria-describedby": o.open ? o.contentId : void 0,
                "data-state": o.stateAttribute,
                ...r,
                ref: c,
                onPointerMove: je(e.onPointerMove, d => {
                    d.pointerType !== "touch" && !u.current && !i.isPointerInTransitRef.current && (o.onTriggerEnter(), u.current = !0)
                }),
                onPointerLeave: je(e.onPointerLeave, () => {
                    o.onTriggerLeave(), u.current = !1
                }),
                onPointerDown: je(e.onPointerDown, () => {
                    o.open && o.onClose(), l.current = !0, document.addEventListener("pointerup", f, {
                        once: !0
                    })
                }),
                onFocus: je(e.onFocus, () => {
                    l.current || o.onOpen()
                }),
                onBlur: je(e.onBlur, o.onClose),
                onClick: je(e.onClick, o.onClose)
            })
        })
    });
Za.displayName = io;
var Ph = "TooltipPortal",
    [y0, Ah] = Xn(Ph, {
        forceMount: void 0
    }),
    _t = "TooltipContent",
    ec = g.forwardRef((e, t) => {
        const n = Ah(_t, e.__scopeTooltip),
            {
                forceMount: r = n.forceMount,
                side: o = "top",
                ...i
            } = e,
            s = Zn(_t, e.__scopeTooltip);
        return H.jsx(Ga, {
            present: r || s.open,
            children: s.disableHoverableContent ? H.jsx(tc, {
                side: o,
                ...i,
                ref: t
            }) : H.jsx(Dh, {
                side: o,
                ...i,
                ref: t
            })
        })
    }),
    Dh = g.forwardRef((e, t) => {
        const n = Zn(_t, e.__scopeTooltip),
            r = jo(_t, e.__scopeTooltip),
            o = g.useRef(null),
            i = ot(t, o),
            [s, a] = g.useState(null),
            {
                trigger: c,
                onClose: l
            } = n,
            u = o.current,
            {
                onPointerInTransitChange: f
            } = r,
            d = g.useCallback(() => {
                a(null), f(!1)
            }, [f]),
            h = g.useCallback((p, m) => {
                const v = p.currentTarget,
                    b = {
                        x: p.clientX,
                        y: p.clientY
                    },
                    _ = Nh(b, v.getBoundingClientRect()),
                    x = Fh(b, _),
                    w = zh(m.getBoundingClientRect()),
                    C = Bh([...x, ...w]);
                a(C), f(!0)
            }, [f]);
        return g.useEffect(() => () => d(), [d]), g.useEffect(() => {
            if (c && u) {
                const p = v => h(v, u),
                    m = v => h(v, c);
                return c.addEventListener("pointerleave", p), u.addEventListener("pointerleave", m), () => {
                    c.removeEventListener("pointerleave", p), u.removeEventListener("pointerleave", m)
                }
            }
        }, [c, u, h, d]), g.useEffect(() => {
            if (s) {
                const p = m => {
                    const v = m.target,
                        b = {
                            x: m.clientX,
                            y: m.clientY
                        },
                        _ = c ?.contains(v) || u ?.contains(v),
                        x = !Wh(b, s);
                    _ ? d() : x && (d(), l())
                };
                return document.addEventListener("pointermove", p), () => document.removeEventListener("pointermove", p)
            }
        }, [c, u, s, l, d]), H.jsx(tc, { ...e,
            ref: i
        })
    }),
    [Mh, jh] = Xn(Ht, {
        isInside: !1
    }),
    Lh = Pf("TooltipContent"),
    tc = g.forwardRef((e, t) => {
        const {
            __scopeTooltip: n,
            children: r,
            "aria-label": o,
            onEscapeKeyDown: i,
            onPointerDownOutside: s,
            ...a
        } = e, c = Zn(_t, n), l = Jn(n), {
            onClose: u
        } = c;
        return g.useEffect(() => (document.addEventListener(oo, u), () => document.removeEventListener(oo, u)), [u]), g.useEffect(() => {
            if (c.trigger) {
                const f = d => {
                    d.target ?.contains(c.trigger) && u()
                };
                return window.addEventListener("scroll", f, {
                    capture: !0
                }), () => window.removeEventListener("scroll", f, {
                    capture: !0
                })
            }
        }, [c.trigger, u]), H.jsx(Ea, {
            asChild: !0,
            disableOutsidePointerEvents: !1,
            onEscapeKeyDown: i,
            onPointerDownOutside: s,
            onFocusOutside: f => f.preventDefault(),
            onDismiss: u,
            children: H.jsxs(hh, {
                "data-state": c.stateAttribute,
                ...l,
                ...a,
                ref: t,
                style: { ...a.style,
                    "--radix-tooltip-content-transform-origin": "var(--radix-popper-transform-origin)",
                    "--radix-tooltip-content-available-width": "var(--radix-popper-available-width)",
                    "--radix-tooltip-content-available-height": "var(--radix-popper-available-height)",
                    "--radix-tooltip-trigger-width": "var(--radix-popper-anchor-width)",
                    "--radix-tooltip-trigger-height": "var(--radix-popper-anchor-height)"
                },
                children: [H.jsx(Lh, {
                    children: r
                }), H.jsx(Mh, {
                    scope: n,
                    isInside: !0,
                    children: H.jsx(Rh, {
                        id: c.contentId,
                        role: "tooltip",
                        children: o || r
                    })
                })]
            })
        })
    });
ec.displayName = _t;
var nc = "TooltipArrow",
    rc = g.forwardRef((e, t) => {
        const {
            __scopeTooltip: n,
            ...r
        } = e, o = Jn(n);
        return jh(nc, n).isInside ? null : H.jsx(ph, { ...o,
            ...r,
            ref: t
        })
    });
rc.displayName = nc;

function Nh(e, t) {
    const n = Math.abs(t.top - e.y),
        r = Math.abs(t.bottom - e.y),
        o = Math.abs(t.right - e.x),
        i = Math.abs(t.left - e.x);
    switch (Math.min(n, r, o, i)) {
        case i:
            return "left";
        case o:
            return "right";
        case n:
            return "top";
        case r:
            return "bottom";
        default:
            throw new Error("unreachable")
    }
}

function Fh(e, t, n = 5) {
    const r = [];
    switch (t) {
        case "top":
            r.push({
                x: e.x - n,
                y: e.y + n
            }, {
                x: e.x + n,
                y: e.y + n
            });
            break;
        case "bottom":
            r.push({
                x: e.x - n,
                y: e.y - n
            }, {
                x: e.x + n,
                y: e.y - n
            });
            break;
        case "left":
            r.push({
                x: e.x + n,
                y: e.y - n
            }, {
                x: e.x + n,
                y: e.y + n
            });
            break;
        case "right":
            r.push({
                x: e.x - n,
                y: e.y - n
            }, {
                x: e.x - n,
                y: e.y + n
            });
            break
    }
    return r
}

function zh(e) {
    const {
        top: t,
        right: n,
        bottom: r,
        left: o
    } = e;
    return [{
        x: o,
        y: t
    }, {
        x: n,
        y: t
    }, {
        x: n,
        y: r
    }, {
        x: o,
        y: r
    }]
}

function Wh(e, t) {
    const {
        x: n,
        y: r
    } = e;
    let o = !1;
    for (let i = 0, s = t.length - 1; i < t.length; s = i++) {
        const a = t[i],
            c = t[s],
            l = a.x,
            u = a.y,
            f = c.x,
            d = c.y;
        u > r != d > r && n < (f - l) * (r - u) / (d - u) + l && (o = !o)
    }
    return o
}

function Bh(e) {
    const t = e.slice();
    return t.sort((n, r) => n.x < r.x ? -1 : n.x > r.x ? 1 : n.y < r.y ? -1 : n.y > r.y ? 1 : 0), Hh(t)
}

function Hh(e) {
    if (e.length <= 1) return e.slice();
    const t = [];
    for (let r = 0; r < e.length; r++) {
        const o = e[r];
        for (; t.length >= 2;) {
            const i = t[t.length - 1],
                s = t[t.length - 2];
            if ((i.x - s.x) * (o.y - s.y) >= (i.y - s.y) * (o.x - s.x)) t.pop();
            else break
        }
        t.push(o)
    }
    t.pop();
    const n = [];
    for (let r = e.length - 1; r >= 0; r--) {
        const o = e[r];
        for (; n.length >= 2;) {
            const i = n[n.length - 1],
                s = n[n.length - 2];
            if ((i.x - s.x) * (o.y - s.y) >= (i.y - s.y) * (o.x - s.x)) n.pop();
            else break
        }
        n.push(o)
    }
    return n.pop(), t.length === 1 && n.length === 1 && t[0].x === n[0].x && t[0].y === n[0].y ? t : t.concat(n)
}
var Vh = Xa,
    Uh = Ja,
    qh = Za,
    Kh = ec,
    Gh = rc;

function Yh(e, t) {
    if (e == null) return {};
    var n = {};
    for (var r in e)
        if ({}.hasOwnProperty.call(e, r)) {
            if (t.indexOf(r) !== -1) continue;
            n[r] = e[r]
        }
    return n
}

function K(e, t) {
    if (e == null) return {};
    var n, r, o = Yh(e, t);
    if (Object.getOwnPropertySymbols) {
        var i = Object.getOwnPropertySymbols(e);
        for (r = 0; r < i.length; r++) n = i[r], t.indexOf(n) === -1 && {}.propertyIsEnumerable.call(e, n) && (o[n] = e[n])
    }
    return o
}
let Z = (function(e) {
    return e[e.UNSUPPORTED_INPUT = 0] = "UNSUPPORTED_INPUT", e[e.NO_COMPONENT_FOR_TYPE = 1] = "NO_COMPONENT_FOR_TYPE", e[e.UNKNOWN_INPUT = 2] = "UNKNOWN_INPUT", e[e.DUPLICATE_KEYS = 3] = "DUPLICATE_KEYS", e[e.ALREADY_REGISTERED_TYPE = 4] = "ALREADY_REGISTERED_TYPE", e[e.CLIPBOARD_ERROR = 5] = "CLIPBOARD_ERROR", e[e.THEME_ERROR = 6] = "THEME_ERROR", e[e.PATH_DOESNT_EXIST = 7] = "PATH_DOESNT_EXIST", e[e.INPUT_TYPE_OVERRIDE = 8] = "INPUT_TYPE_OVERRIDE", e[e.EMPTY_KEY = 9] = "EMPTY_KEY", e
})({});
const Qh = {
    [Z.UNSUPPORTED_INPUT]: (e, t) => [`An input with type \`${e}\` input was found at path \`${t}\` but it's not supported yet.`],
    [Z.NO_COMPONENT_FOR_TYPE]: (e, t) => [`Type \`${e}\` found at path \`${t}\` can't be displayed in panel because no component supports it yet.`],
    [Z.UNKNOWN_INPUT]: (e, t) => [`input at path \`${e}\` is not recognized.`, t],
    [Z.DUPLICATE_KEYS]: (e, t, n) => [`Key \`${e}\` of path \`${t}\` already exists at path \`${n}\`. Even nested keys need to be unique. Rename one of the keys.`],
    [Z.ALREADY_REGISTERED_TYPE]: e => [`Type ${e} has already been registered. You can't register a component with the same type.`],
    [Z.CLIPBOARD_ERROR]: e => ["Error copying the value", e],
    [Z.THEME_ERROR]: (e, t) => [`Error accessing the theme \`${e}.${t}\` value.`],
    [Z.PATH_DOESNT_EXIST]: e => [`Error getting the value at path \`${e}\`. There is probably an error in your \`render\` function.`],
    [Z.INPUT_TYPE_OVERRIDE]: (e, t, n) => [`Input at path \`${e}\` already exists with type: \`${t}\`. Its type cannot be overridden with type \`${n}\`.`],
    [Z.EMPTY_KEY]: () => ["Keys can not be empty, if you want to hide a label use whitespace."]
};

function oc(e, t, ...n) {
    const r = Qh[t],
        [o, ...i] = r(...n);
    console[e]("LEVA: " + o, ...i)
}
const Le = oc.bind(null, "warn"),
    Xh = oc.bind(null, "log"),
    Jh = ["value"],
    Zh = ["schema"],
    ep = ["value"],
    ic = [],
    rt = {};

function Pi(e) {
    let {
        value: t
    } = e, n = K(e, Jh);
    for (let r of ic) {
        const o = r(t, n);
        if (o) return o
    }
}

function Ve(e, t) {
    let {
        schema: n
    } = t, r = K(t, Zh);
    if (e in rt) {
        Le(Z.ALREADY_REGISTERED_TYPE, e);
        return
    }
    ic.push((o, i) => n(o, i) && e), rt[e] = r
}

function vr(e, t, n, r) {
    const {
        normalize: o
    } = rt[e];
    if (o) return o(t, n, r);
    if (typeof t != "object" || !("value" in t)) return {
        value: t
    };
    const {
        value: i
    } = t, s = K(t, ep);
    return {
        value: i,
        settings: s
    }
}

function tp(e, t, n, r, o, i) {
    const {
        sanitize: s
    } = rt[e];
    return s ? s(t, n, r, o, i) : t
}

function Ai(e, t, n) {
    const {
        format: r
    } = rt[e];
    return r ? r(t, n) : t
}

function np(e, t) {
    if (typeof e != "object" || !e) return e;
    var n = e[Symbol.toPrimitive];
    if (n !== void 0) {
        var r = n.call(e, t);
        if (typeof r != "object") return r;
        throw new TypeError("@@toPrimitive must return a primitive value.")
    }
    return (t === "string" ? String : Number)(e)
}

function rp(e) {
    var t = np(e, "string");
    return typeof t == "symbol" ? t : t + ""
}

function op(e, t, n) {
    return (t = rp(t)) in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Di(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var r = Object.getOwnPropertySymbols(e);
        t && (r = r.filter(function(o) {
            return Object.getOwnPropertyDescriptor(e, o).enumerable
        })), n.push.apply(n, r)
    }
    return n
}

function F(e) {
    for (var t = 1; t < arguments.length; t++) {
        var n = arguments[t] != null ? arguments[t] : {};
        t % 2 ? Di(Object(n), !0).forEach(function(r) {
            op(e, r, n[r])
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Di(Object(n)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r))
        })
    }
    return e
}
const Ye = (e, t, n) => e > n ? n : e < t ? t : e,
    ip = e => {
        if (e === "" || typeof e == "number") return e;
        try {
            const t = ht(e);
            if (!isNaN(t)) return t
        } catch {}
        return parseFloat(e)
    },
    sp = Math.log(10);

function Mi(e) {
    let t = Math.abs(+String(e).replace(".", ""));
    if (t === 0) return .01;
    for (; t !== 0 && t % 10 === 0;) t /= 10;
    const n = Math.floor(Math.log(t) / sp) + 1,
        r = Math.floor(Math.log10(Math.abs(e))),
        o = Math.pow(10, r - n);
    return Math.max(o, .001)
}
const An = (e, t, n) => n === t ? 0 : (Ye(e, t, n) - t) / (n - t),
    Dn = (e, t, n) => e * (n - t) + t,
    ap = () => "_" + Math.random().toString(36).substr(2, 9),
    ji = /\(([^\(\)]+)\)/,
    Li = /(-?\d+(?:\.\d+)?)\s*\^\s*(-?\d+(?:\.\d+)?)/,
    Ni = /(-?\d+(?:\.\d+)?)\s*([*/])\s*(-?\d+(?:\.\d+)?)/,
    Fi = /(-?\d+(?:\.\d+)?)\s*([+-])\s*(-?\d+(?:\.\d+)?)/;

function ht(e) {
    return e = e.replace(/\s+/g, ""), ji.test(e) ? ht(e.replace(ji, (t, n) => ht(n).toString())) : Li.test(e) ? ht(e.replace(Li, (t, n, r) => Math.pow(Number(n), Number(r)).toString())) : Ni.test(e) ? ht(e.replace(Ni, (t, n, r, o) => r === "*" ? (Number(n) * Number(o)).toString() : Number(o) === 0 ? (() => {
        throw new Error("Division by zero")
    })() : (Number(n) / Number(o)).toString())) : Fi.test(e) ? ht(e.replace(Fi, (t, n, r, o) => r === "+" ? (Number(n) + Number(o)).toString() : (Number(n) - Number(o)).toString())) : Number(e)
}

function cp(e, t) {
    return t.reduce((n, r) => (e && e.hasOwnProperty(r) && (n[r] = e[r]), n), {})
}

function lp(e, t) {
    const n = F({}, e);
    return t.forEach(r => r in e && delete n[r]), n
}

function up(e, t) {
    return e.reduce((n, r, o) => Object.assign(n, {
        [t[o]]: r
    }), {})
}

function sc(e) {
    return Object.prototype.toString.call(e) === "[object Object]"
}
const fp = e => sc(e) && Object.keys(e).length === 0;
let Oe = (function(e) {
        return e.BUTTON = "BUTTON", e.BUTTON_GROUP = "BUTTON_GROUP", e.MONITOR = "MONITOR", e.FOLDER = "FOLDER", e
    })({}),
    Ue = (function(e) {
        return e.SELECT = "SELECT", e.IMAGE = "IMAGE", e.NUMBER = "NUMBER", e.COLOR = "COLOR", e.STRING = "STRING", e.BOOLEAN = "BOOLEAN", e.INTERVAL = "INTERVAL", e.VECTOR3D = "VECTOR3D", e.VECTOR2D = "VECTOR2D", e
    })({});
const dp = ["type", "__customInput"],
    hp = ["render", "label", "optional", "order", "disabled", "hint", "onChange", "onEditStart", "onEditEnd", "transient"],
    pp = ["type"];

function ac(e, t, n = {}, r) {
    var o, i;
    if (typeof e != "object" || Array.isArray(e)) return {
        type: r,
        input: e,
        options: F({
            key: t,
            label: t,
            optional: !1,
            disabled: !1,
            order: 0
        }, n)
    };
    if ("__customInput" in e) {
        const {
            type: C,
            __customInput: E
        } = e, S = K(e, dp);
        return ac(E, t, S, C)
    }
    const {
        render: s,
        label: a,
        optional: c,
        order: l = 0,
        disabled: u,
        hint: f,
        onChange: d,
        onEditStart: h,
        onEditEnd: p,
        transient: m
    } = e, v = K(e, hp), b = F({
        render: s,
        key: t,
        label: a ?? t,
        hint: f,
        transient: m ?? !!d,
        onEditStart: h,
        onEditEnd: p,
        disabled: u,
        optional: c,
        order: l
    }, n);
    let {
        type: _
    } = v, x = K(v, pp);
    if (_ = r ?? _, _ in Oe) return {
        type: _,
        input: x,
        options: b
    };
    let w;
    return r && sc(x) && "value" in x ? w = x.value : w = fp(x) ? void 0 : x, {
        type: _,
        input: w,
        options: F(F({}, b), {}, {
            onChange: d,
            optional: (o = b.optional) !== null && o !== void 0 ? o : !1,
            disabled: (i = b.disabled) !== null && i !== void 0 ? i : !1
        })
    }
}

function gp(e, t, n, r) {
    const o = ac(e, t),
        {
            type: i,
            input: s,
            options: a
        } = o;
    if (i) return i in Oe ? o : {
        type: i,
        input: vr(i, s, n, r),
        options: a
    };
    let c = Pi(s);
    return c ? {
        type: c,
        input: vr(c, s, n, r),
        options: a
    } : (c = Pi({
        value: s
    }), c ? {
        type: c,
        input: vr(c, {
            value: s
        }, n, r),
        options: a
    } : !1)
}

function zi(e, t, n, r, o) {
    const {
        value: i,
        type: s,
        settings: a
    } = e;
    e.value = cc({
        type: s,
        value: i,
        settings: a
    }, t, n, r), e.fromPanel = o
}
const mp = function(t, n, r) {
    this.type = "LEVA_ERROR", this.message = "LEVA: " + t, this.previousValue = n, this.error = r
};

function cc({
    type: e,
    value: t,
    settings: n
}, r, o, i) {
    const s = e !== "SELECT" && typeof r == "function" ? r(t) : r;
    let a;
    try {
        a = tp(e, s, n, t, o, i)
    } catch (c) {
        throw new mp(`The value \`${r}\` did not result in a correct value.`, t, c)
    }
    return zt(a, t) ? t : a
}
const lc = (e, t, n = !1) => {
        let r = 0;
        return function() {
            const o = arguments,
                i = n && !r,
                s = () => e.apply(this, o);
            window.clearTimeout(r), r = window.setTimeout(s, t), i && s()
        }
    },
    uc = e => e.shiftKey ? 5 : e.altKey ? 1 / 5 : 1,
    vp = ["value"],
    bp = ["min", "max"],
    yp = e => {
        if (typeof e == "number") return !0;
        if (typeof e == "string") {
            const t = parseFloat(e);
            return isNaN(t) ? !1 : e.substring(("" + t).length).trim().length < 4
        }
        return !1
    },
    fc = (e, {
        min: t = -1 / 0,
        max: n = 1 / 0,
        suffix: r
    }) => {
        const o = parseFloat(e);
        if (e === "" || isNaN(o)) throw Error("Invalid number");
        const i = Ye(o, t, n);
        return r ? i + r : i
    },
    _p = (e, {
        pad: t = 0,
        suffix: n
    }) => {
        const r = parseFloat(e).toFixed(t);
        return n ? r + n : r
    },
    dc = e => {
        let {
            value: t
        } = e, n = K(e, vp);
        const {
            min: r = -1 / 0,
            max: o = 1 / 0
        } = n, i = K(n, bp);
        let s = parseFloat(t);
        const a = typeof t == "string" ? t.substring(("" + s).length) : void 0;
        s = Ye(s, r, o);
        let c = n.step;
        c || (Number.isFinite(r) ? Number.isFinite(o) ? c = +(Math.abs(o - r) / 100).toPrecision(1) : c = +(Math.abs(s - r) / 100).toPrecision(1) : Number.isFinite(o) && (c = +(Math.abs(o - s) / 100).toPrecision(1)));
        const l = c ? Mi(c) * 10 : Mi(s);
        c = c || l / 10;
        const u = Math.round(Ye(Math.log10(1 / l), 0, 2));
        return {
            value: a ? s + a : s,
            settings: F({
                initialValue: s,
                step: c,
                pad: u,
                min: r,
                max: o,
                suffix: a
            }, i)
        }
    },
    hc = (e, {
        step: t,
        initialValue: n
    }) => {
        const r = Math.round((e - n) / t);
        return n + r * t
    };
var pc = Object.freeze({
    __proto__: null,
    schema: yp,
    sanitize: fc,
    format: _p,
    normalize: dc,
    sanitizeStep: hc
});

function J() {
    return J = Object.assign ? Object.assign.bind() : function(e) {
        for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t];
            for (var r in n)({}).hasOwnProperty.call(n, r) && (e[r] = n[r])
        }
        return e
    }, J.apply(null, arguments)
}
const gc = g.createContext({});

function ie() {
    return g.useContext(gc)
}
const Lo = g.createContext(null),
    mc = g.createContext(null),
    vc = g.createContext(null);

function Xt() {
    return g.useContext(mc)
}

function xp() {
    return g.useContext(vc)
}
const bc = () => ({
    colors: {
        elevation1: "#292d39",
        elevation2: "#181c20",
        elevation3: "#373c4b",
        accent1: "#0066dc",
        accent2: "#007bff",
        accent3: "#3c93ff",
        highlight1: "#535760",
        highlight2: "#8c92a4",
        highlight3: "#fefefe",
        vivid1: "#ffcc00",
        folderWidgetColor: "$highlight2",
        folderTextColor: "$highlight3",
        toolTipBackground: "$highlight3",
        toolTipText: "$elevation2"
    },
    radii: {
        xs: "2px",
        sm: "3px",
        lg: "10px"
    },
    space: {
        xs: "3px",
        sm: "6px",
        md: "10px",
        rowGap: "7px",
        colGap: "7px"
    },
    fonts: {
        mono: "ui-monospace, SFMono-Regular, Menlo, 'Roboto Mono', monospace",
        sans: "system-ui, sans-serif"
    },
    fontSizes: {
        root: "11px",
        toolTip: "$root"
    },
    sizes: {
        rootWidth: "280px",
        controlWidth: "160px",
        numberInputMinWidth: "38px",
        scrubberWidth: "8px",
        scrubberHeight: "16px",
        rowHeight: "24px",
        folderTitleHeight: "20px",
        checkboxSize: "16px",
        joystickWidth: "100px",
        joystickHeight: "100px",
        colorPickerWidth: "$controlWidth",
        colorPickerHeight: "100px",
        imagePreviewWidth: "$controlWidth",
        imagePreviewHeight: "100px",
        monitorHeight: "60px",
        titleBarHeight: "39px"
    },
    shadows: {
        level1: "0 0 9px 0 #00000088",
        level2: "0 4px 14px #00000033"
    },
    borderWidths: {
        root: "0px",
        input: "1px",
        focus: "1px",
        hover: "1px",
        active: "1px",
        folder: "1px"
    },
    fontWeights: {
        label: "normal",
        folder: "normal",
        button: "normal"
    }
});

function vn(e, t) {
    const [n, r] = e.split(" "), o = {};
    return n !== "none" && (o.boxShadow = `${t.inset?"inset ":""}0 0 0 $borderWidths${[t.key]} $colors${n!=="default"&&n||t.borderColor}`), r && (o.backgroundColor = r), o
}
const kt = {
        $inputStyle: () => e => vn(e, {
            key: "$input",
            borderColor: "$highlight1",
            inset: !0
        }),
        $focusStyle: () => e => vn(e, {
            key: "$focus",
            borderColor: "$accent2"
        }),
        $hoverStyle: () => e => vn(e, {
            key: "$hover",
            borderColor: "$accent1",
            inset: !0
        }),
        $activeStyle: () => e => vn(e, {
            key: "$active",
            borderColor: "$accent1",
            inset: !0
        })
    },
    Jt = bu({
        prefix: "leva",
        theme: bc(),
        utils: F(F({}, kt), {}, {
            $flex: () => ({
                display: "flex",
                alignItems: "center"
            }),
            $flexCenter: () => ({
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }),
            $reset: () => ({
                outline: "none",
                fontSize: "inherit",
                fontWeight: "inherit",
                color: "inherit",
                fontFamily: "inherit",
                border: "none",
                backgroundColor: "transparent",
                appearance: "none"
            }),
            $draggable: () => ({
                touchAction: "none",
                WebkitUserDrag: "none",
                userSelect: "none"
            }),
            $focus: e => ({
                "&:focus": kt.$focusStyle()(e)
            }),
            $focusWithin: e => ({
                "&:focus-within": kt.$focusStyle()(e)
            }),
            $hover: e => ({
                "&:hover": kt.$hoverStyle()(e)
            }),
            $active: e => ({
                "&:active": kt.$activeStyle()(e)
            })
        })
    }),
    L = Jt.styled;
Jt.css;
const wp = Jt.createTheme,
    Ep = Jt.globalCss;
Jt.keyframes;
const $p = Ep({
    ".leva__panel__dragged": {
        WebkitUserDrag: "none",
        userSelect: "none",
        input: {
            userSelect: "none"
        },
        "*": {
            cursor: "ew-resize !important"
        }
    }
});

function Sp(e) {
    const t = bc();
    if (!e) return {
        theme: t,
        className: ""
    };
    Object.keys(e).forEach(r => {
        Object.assign(t[r], e[r])
    });
    const n = wp(t);
    return {
        theme: t,
        className: n.className
    }
}

function Ne(e, t) {
    const {
        theme: n
    } = g.useContext(Lo);
    if (!(e in n) || !(t in n[e])) return Le(Z.THEME_ERROR, e, t), "";
    let r = t;
    for (;;) {
        let o = n[e][r];
        if (typeof o == "string" && o.charAt(0) === "$") r = o.substr(1);
        else return o
    }
}
const yc = L("input", {
        $reset: "",
        padding: "0 $sm",
        width: 0,
        minWidth: 0,
        flex: 1,
        height: "100%",
        variants: {
            levaType: {
                number: {
                    textAlign: "right"
                }
            },
            as: {
                textarea: {
                    padding: "$sm"
                }
            }
        }
    }),
    _c = L("div", {
        $draggable: "",
        height: "100%",
        $flexCenter: "",
        position: "relative",
        padding: "0 $xs",
        fontSize: "0.8em",
        opacity: .8,
        cursor: "default",
        touchAction: "none",
        [`& + ${yc}`]: {
            paddingLeft: 0
        }
    }),
    Cp = L(_c, {
        cursor: "ew-resize",
        marginRight: "-$xs",
        textTransform: "uppercase",
        opacity: .3,
        "&:hover": {
            opacity: 1
        },
        variants: {
            dragging: {
                true: {
                    backgroundColor: "$accent2",
                    opacity: 1
                }
            }
        }
    }),
    Tp = L("div", {
        $flex: "",
        position: "relative",
        borderRadius: "$sm",
        overflow: "hidden",
        color: "inherit",
        height: "$rowHeight",
        backgroundColor: "$elevation3",
        $inputStyle: "$elevation1",
        $hover: "",
        $focusWithin: "",
        variants: {
            textArea: {
                true: {
                    height: "auto"
                }
            }
        }
    }),
    Rp = ["innerLabel", "value", "onUpdate", "onChange", "onKeyDown", "type", "id", "inputType", "rows"],
    Op = ["onUpdate"];

function No(e) {
    let {
        innerLabel: t,
        value: n,
        onUpdate: r,
        onChange: o,
        onKeyDown: i,
        type: s,
        id: a,
        inputType: c = "text",
        rows: l = 0
    } = e, u = K(e, Rp);
    const {
        id: f,
        emitOnEditStart: d,
        emitOnEditEnd: h,
        disabled: p
    } = ie(), m = a || f, v = g.useRef(null), b = l > 0, _ = b ? "textarea" : "input", x = g.useCallback(E => S => {
        const R = S.currentTarget.value;
        E(R)
    }, []);
    y.useEffect(() => {
        const E = v.current,
            S = x(R => {
                r(R), h()
            });
        return E ?.addEventListener("blur", S), () => E ?.removeEventListener("blur", S)
    }, [x, r, h]);
    const w = g.useCallback(E => {
            E.key === "Enter" && x(r)(E)
        }, [x, r]),
        C = Object.assign({
            as: _
        }, b ? {
            rows: l
        } : {}, u);
    return y.createElement(Tp, {
        textArea: b
    }, t && typeof t == "string" ? y.createElement(_c, null, t) : t, y.createElement(yc, J({
        levaType: s,
        ref: v,
        id: m,
        type: c,
        autoComplete: "off",
        spellCheck: "false",
        value: n,
        onChange: x(o),
        onFocus: () => d(),
        onKeyPress: w,
        onKeyDown: i,
        disabled: p
    }, C)))
}

function kp(e) {
    let {
        onUpdate: t
    } = e, n = K(e, Op);
    const r = g.useCallback(i => t(ip(i)), [t]),
        o = g.useCallback(i => {
            const s = i.key === "ArrowUp" ? 1 : i.key === "ArrowDown" ? -1 : 0;
            if (s) {
                i.preventDefault();
                const a = i.altKey ?.1 : i.shiftKey ? 10 : 1;
                t(c => parseFloat(c) + s * a)
            }
        }, [t]);
    return y.createElement(No, J({}, n, {
        onUpdate: r,
        onKeyDown: o,
        type: "number"
    }))
}
const Mn = L("div", {}),
    so = L("div", {
        position: "relative",
        background: "$elevation2",
        transition: "height 300ms ease",
        variants: {
            fill: {
                true: {},
                false: {}
            },
            flat: {
                false: {},
                true: {}
            },
            isRoot: {
                true: {},
                false: {
                    paddingLeft: "$md",
                    "&::after": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "$borderWidths$folder",
                        height: "100%",
                        backgroundColor: "$folderWidgetColor",
                        opacity: .4,
                        transform: "translateX(-50%)"
                    }
                }
            }
        },
        compoundVariants: [{
            isRoot: !0,
            fill: !1,
            css: {
                overflowY: "auto",
                maxHeight: "calc(100vh - 20px - $$titleBarHeight)"
            }
        }, {
            isRoot: !0,
            flat: !1,
            css: {
                borderRadius: "$lg"
            }
        }]
    }),
    Ip = L("div", {
        $flex: "",
        color: "$folderTextColor",
        userSelect: "none",
        cursor: "pointer",
        height: "$folderTitleHeight",
        fontWeight: "$folder",
        "> svg": {
            marginLeft: -4,
            marginRight: 4,
            cursor: "pointer",
            fill: "$folderWidgetColor",
            opacity: .6
        },
        "&:hover > svg": {
            fill: "$folderWidgetColor"
        },
        [`&:hover + ${so}::after`]: {
            opacity: .6
        },
        [`${Mn}:hover > & + ${so}::after`]: {
            opacity: .6
        },
        [`${Mn}:hover > & > svg`]: {
            opacity: 1
        }
    }),
    xc = L("div", {
        position: "relative",
        display: "grid",
        gridTemplateColumns: "100%",
        rowGap: "$rowGap",
        transition: "opacity 250ms ease",
        variants: {
            toggled: {
                true: {
                    opacity: 1,
                    transitionDelay: "250ms"
                },
                false: {
                    opacity: 0,
                    transitionDelay: "0ms",
                    pointerEvents: "none"
                }
            },
            isRoot: {
                true: {
                    "& > div": {
                        paddingLeft: "$md",
                        paddingRight: "$md"
                    },
                    "& > div:first-of-type": {
                        paddingTop: "$sm"
                    },
                    "& > div:last-of-type": {
                        paddingBottom: "$sm"
                    },
                    [`> ${Mn}:not(:first-of-type)`]: {
                        paddingTop: "$sm",
                        marginTop: "$md",
                        borderTop: "$borderWidths$folder solid $colors$elevation1"
                    }
                }
            }
        }
    }),
    wc = L("div", {
        position: "relative",
        zIndex: 100,
        display: "grid",
        rowGap: "$rowGap",
        gridTemplateRows: "minmax($sizes$rowHeight, max-content)",
        alignItems: "center",
        color: "$highlight2",
        [`${xc} > &`]: {
            "&:first-of-type": {
                marginTop: "$rowGap"
            },
            "&:last-of-type": {
                marginBottom: "$rowGap"
            }
        },
        variants: {
            disabled: {
                true: {
                    pointerEvents: "none"
                },
                false: {
                    "&:hover,&:focus-within": {
                        color: "$highlight3"
                    }
                }
            }
        }
    }),
    Ec = L(wc, {
        gridTemplateColumns: "auto $sizes$controlWidth",
        columnGap: "$colGap"
    }),
    Pp = L("div", {
        $flex: "",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        "& > div": {
            marginLeft: "$colGap",
            padding: "0 $xs",
            opacity: .4
        },
        "& > div:hover": {
            opacity: .8
        },
        "& > div > svg": {
            display: "none",
            cursor: "pointer",
            width: 13,
            minWidth: 13,
            height: 13,
            backgroundColor: "$elevation2"
        },
        "&:hover > div > svg": {
            display: "block"
        },
        variants: {
            align: {
                top: {
                    height: "100%",
                    alignItems: "flex-start",
                    paddingTop: "$sm"
                }
            }
        }
    }),
    Ap = L("input", {
        $reset: "",
        height: 0,
        width: 0,
        opacity: 0,
        margin: 0,
        "& + label": {
            position: "relative",
            $flexCenter: "",
            height: "100%",
            userSelect: "none",
            cursor: "pointer",
            paddingLeft: 2,
            paddingRight: "$sm",
            pointerEvents: "auto"
        },
        "& + label:after": {
            content: '""',
            width: 6,
            height: 6,
            backgroundColor: "$elevation3",
            borderRadius: "50%",
            $activeStyle: ""
        },
        "&:focus + label:after": {
            $focusStyle: ""
        },
        "& + label:active:after": {
            backgroundColor: "$accent1",
            $focusStyle: ""
        },
        "&:checked + label:after": {
            backgroundColor: "$accent1"
        }
    }),
    ao = L("label", {
        fontWeight: "$label",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        "& > svg": {
            display: "block"
        }
    }),
    Dp = L("div", {
        opacity: 1,
        variants: {
            disabled: {
                true: {
                    opacity: .6,
                    pointerEvents: "none",
                    [`& ${ao}`]: {
                        pointerEvents: "auto"
                    }
                }
            }
        }
    }),
    $c = L("div", {
        position: "fixed",
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        zIndex: 1e3,
        userSelect: "none"
    }),
    Mp = L("div", {
        background: "$toolTipBackground",
        fontFamily: "$sans",
        fontSize: "$toolTip",
        padding: "$xs $sm",
        color: "$toolTipText",
        borderRadius: "$xs",
        boxShadow: "$level2",
        maxWidth: 260
    }),
    jp = L(Gh, {
        fill: "$toolTipBackground"
    });

function Fo({
    children: e,
    container: t = (n => globalThis == null || (n = globalThis.document) === null || n === void 0 ? void 0 : n.body)()
}) {
    const {
        className: n
    } = g.useContext(Lo);
    return y.createElement(zl, {
        className: n,
        container: t
    }, e)
}
const Lp = ["align"];

function Np() {
    const {
        id: e,
        disable: t,
        disabled: n
    } = ie();
    return y.createElement(y.Fragment, null, y.createElement(Ap, {
        id: e + "__disable",
        type: "checkbox",
        checked: !n,
        onChange: () => t(!n)
    }), y.createElement("label", {
        htmlFor: e + "__disable"
    }))
}

function Fp(e) {
    const {
        id: t,
        optional: n,
        hint: r
    } = ie(), o = e.htmlFor || t || void 0, i = !r && typeof e.children == "string" ? e.children : void 0;
    return y.createElement(y.Fragment, null, n && y.createElement(Np, null), r !== void 0 ? y.createElement(Uh, null, y.createElement(qh, {
        asChild: !0
    }, y.createElement(ao, J({
        htmlFor: o
    }, e))), y.createElement(Kh, {
        side: "top",
        sideOffset: 2
    }, y.createElement(Mp, null, r, y.createElement(jp, null)))) : y.createElement(ao, J({
        htmlFor: o,
        title: i
    }, e)))
}

function $e(e) {
    let {
        align: t
    } = e, n = K(e, Lp);
    const {
        value: r,
        label: o,
        key: i,
        disabled: s
    } = ie(), {
        hideCopyButton: a
    } = xp(), c = !a && i !== void 0, [l, u] = g.useState(!1), f = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify({
                [i]: r ?? ""
            })), u(!0)
        } catch {
            Le(Z.CLIPBOARD_ERROR, {
                [i]: r
            })
        }
    };
    return y.createElement(Pp, {
        align: t,
        onPointerLeave: () => u(!1)
    }, y.createElement(Fp, n), c && !s && y.createElement("div", {
        title: `Click to copy ${typeof o=="string"?o:i} value`
    }, l ? y.createElement("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 20 20",
        fill: "currentColor"
    }, y.createElement("path", {
        d: "M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
    }), y.createElement("path", {
        fillRule: "evenodd",
        d: "M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
        clipRule: "evenodd"
    })) : y.createElement("svg", {
        onClick: f,
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 20 20",
        fill: "currentColor"
    }, y.createElement("path", {
        d: "M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
    }), y.createElement("path", {
        d: "M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"
    }))))
}
const zp = ["toggled"],
    Wp = L("svg", {
        fill: "currentColor",
        transition: "transform 350ms ease, fill 250ms ease"
    });

function zo(e) {
    let {
        toggled: t
    } = e, n = K(e, zp);
    return y.createElement(Wp, J({
        width: "9",
        height: "5",
        viewBox: "0 0 9 5",
        xmlns: "http://www.w3.org/2000/svg",
        style: {
            transform: `rotate(${t?0:-90}deg)`
        }
    }, n), y.createElement("path", {
        d: "M3.8 4.4c.4.3 1 .3 1.4 0L8 1.7A1 1 0 007.4 0H1.6a1 1 0 00-.7 1.7l3 2.7z"
    }))
}
const Bp = ["input"];

function ye(e) {
    let {
        input: t
    } = e, n = K(e, Bp);
    return t ? y.createElement(Ec, n) : y.createElement(wc, n)
}

function Sc({
    value: e,
    type: t,
    settings: n,
    setValue: r
}) {
    const [o, i] = g.useState(Ai(t, e, n)), s = g.useRef(e), a = g.useRef(n);
    a.current = n;
    const c = g.useCallback(u => i(Ai(t, u, a.current)), [t]),
        l = g.useCallback(u => {
            try {
                r(u)
            } catch (f) {
                const {
                    type: d,
                    previousValue: h
                } = f;
                if (d !== "LEVA_ERROR") throw f;
                c(h)
            }
        }, [c, r]);
    return g.useEffect(() => {
        zt(e, s.current) || c(e), s.current = e
    }, [e, c]), {
        displayValue: o,
        onChange: i,
        onUpdate: l
    }
}

function Zt(e, t) {
    const {
        emitOnEditStart: n,
        emitOnEditEnd: r
    } = ie();
    return Rf(o => {
        o.first && (document.body.classList.add("leva__panel__dragged"), n ?.());
        const i = e(o);
        return o.last && (document.body.classList.remove("leva__panel__dragged"), r ?.()), i
    }, t)
}

function Hp(e) {
    const t = g.useRef(null),
        n = g.useRef(null),
        r = g.useRef(!1);
    return g.useEffect(() => {
        const o = lc(() => {
            t.current.width = t.current.offsetWidth * window.devicePixelRatio, t.current.height = t.current.offsetHeight * window.devicePixelRatio, e(t.current, n.current)
        }, 250);
        return window.addEventListener("resize", o), r.current || (o(), r.current = !0), () => window.removeEventListener("resize", o)
    }, [e]), g.useEffect(() => {
        n.current = t.current.getContext("2d")
    }, []), [t, n]
}

function Cc() {
    const e = g.useRef(null),
        t = g.useRef({
            x: 0,
            y: 0
        }),
        n = g.useCallback(r => {
            Object.assign(t.current, r), e.current && (e.current.style.transform = `translate3d(${t.current.x}px, ${t.current.y}px, 0)`)
        }, []);
    return [e, n]
}
const Vp = ["__refCount"],
    br = (e, t) => {
        if (!e[t]) return null;
        const n = e[t];
        return K(n, Vp)
    };

function Up(e) {
    const t = Xt(),
        [n, r] = g.useState(br(t.getData(), e)),
        o = g.useCallback(l => t.setValueAtPath(e, l, !0), [e, t]),
        i = g.useCallback(l => t.setSettingsAtPath(e, l), [e, t]),
        s = g.useCallback(l => t.disableInputAtPath(e, l), [e, t]),
        a = g.useCallback(() => t.emitOnEditStart(e), [e, t]),
        c = g.useCallback(() => t.emitOnEditEnd(e), [e, t]);
    return g.useEffect(() => {
        r(br(t.getData(), e));
        const l = t.useStore.subscribe(u => br(u.data, e), r, {
            equalityFn: Hn
        });
        return () => l()
    }, [t, e]), [n, {
        set: o,
        setSettings: i,
        disable: s,
        storeId: t.storeId,
        emitOnEditStart: a,
        emitOnEditEnd: c
    }]
}
const qp = L("div", {
        variants: {
            hasRange: {
                true: {
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: "auto $sizes$numberInputMinWidth",
                    columnGap: "$colGap",
                    alignItems: "center"
                }
            }
        }
    }),
    Tc = L("div", {
        position: "relative",
        width: "100%",
        height: 2,
        borderRadius: "$xs",
        backgroundColor: "$elevation1"
    }),
    co = L("div", {
        position: "absolute",
        width: "$scrubberWidth",
        height: "$scrubberHeight",
        borderRadius: "$xs",
        boxShadow: "0 0 0 2px $colors$elevation2",
        backgroundColor: "$accent2",
        cursor: "pointer",
        $active: "none $accent1",
        $hover: "none $accent3",
        variants: {
            position: {
                left: {
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    transform: "translateX(calc(-0.5 * ($sizes$scrubberWidth + 4px)))"
                },
                right: {
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    transform: "translateX(calc(0.5 * ($sizes$scrubberWidth + 4px)))"
                }
            }
        }
    }),
    Rc = L("div", {
        position: "relative",
        $flex: "",
        height: "100%",
        cursor: "pointer",
        touchAction: "none"
    }),
    Oc = L("div", {
        position: "absolute",
        height: "100%",
        backgroundColor: "$accent2"
    });

function Kp({
    value: e,
    min: t,
    max: n,
    onDrag: r,
    step: o,
    initialValue: i
}) {
    const s = g.useRef(null),
        a = g.useRef(null),
        c = g.useRef(0),
        l = Ne("sizes", "scrubberWidth"),
        u = Zt(({
            event: d,
            first: h,
            xy: [p],
            movement: [m],
            memo: v
        }) => {
            if (h) {
                const {
                    width: _,
                    left: x
                } = s.current.getBoundingClientRect();
                c.current = _ - parseFloat(l), v = d ?.target === a.current ? e : Dn((p - x) / _, t, n)
            }
            const b = v + Dn(m / c.current, 0, n - t);
            return r(hc(b, {
                step: o,
                initialValue: i
            })), v
        }),
        f = An(e, t, n);
    return y.createElement(Rc, J({
        ref: s
    }, u()), y.createElement(Tc, null, y.createElement(Oc, {
        style: {
            left: 0,
            right: `${(1-f)*100}%`
        }
    })), y.createElement(co, {
        ref: a,
        style: {
            left: `calc(${f} * (100% - ${l}))`
        }
    }))
}
const Gp = y.memo(({
    label: e,
    onUpdate: t,
    step: n,
    innerLabelTrim: r
}) => {
    const [o, i] = g.useState(!1), s = Zt(({
        active: a,
        delta: [c],
        event: l,
        memo: u = 0,
        first: f,
        last: d,
        target: h
    }) => (f && h.requestPointerLock(), d && document.exitPointerLock(), i(a), u += c / 2, Math.abs(u) >= 1 && (t(p => parseFloat(p) + Math.floor(u) * n * uc(l)), u = 0), u));
    return y.createElement(Cp, J({
        dragging: o,
        title: e.length > 1 ? e : ""
    }, s()), e.slice(0, r))
});

function kc({
    label: e,
    id: t,
    displayValue: n,
    onUpdate: r,
    onChange: o,
    settings: i,
    innerLabelTrim: s = 1
}) {
    const a = s > 0 && y.createElement(Gp, {
        label: e,
        step: i.step,
        onUpdate: r,
        innerLabelTrim: s
    });
    return y.createElement(kp, {
        id: t,
        value: String(n),
        onUpdate: r,
        onChange: o,
        innerLabel: a
    })
}

function Yp() {
    const e = ie(),
        {
            label: t,
            value: n,
            onUpdate: r,
            settings: o,
            id: i
        } = e,
        {
            min: s,
            max: a
        } = o,
        c = a !== 1 / 0 && s !== -1 / 0;
    return y.createElement(ye, {
        input: !0
    }, y.createElement($e, null, t), y.createElement(qp, {
        hasRange: c
    }, c && y.createElement(Kp, J({
        value: parseFloat(n),
        onDrag: r
    }, o)), y.createElement(kc, J({}, e, {
        id: i,
        label: "value",
        innerLabelTrim: c ? 0 : 1
    }))))
}
const {
    sanitizeStep: Qp
} = pc, Xp = K(pc, ["sanitizeStep"]);
var Jp = F({
    component: Yp
}, Xp);
const Zp = (e, t) => fe().schema({
        options: fe().passesAnyOf(fe().object(), fe().array())
    }).test(t),
    eg = (e, {
        values: t
    }) => {
        if (t.indexOf(e) < 0) throw Error("Selected value doesn't match Select options");
        return e
    },
    tg = (e, {
        values: t
    }) => t.indexOf(e),
    ng = e => {
        let {
            value: t,
            options: n
        } = e, r, o;
        return Array.isArray(n) ? (o = n, r = n.map(i => String(i))) : (o = Object.values(n), r = Object.keys(n)), "value" in e ? o.includes(t) || (r.unshift(String(t)), o.unshift(t)) : t = o[0], Object.values(n).includes(t) || (n[String(t)] = t), {
            value: t,
            settings: {
                keys: r,
                values: o
            }
        }
    };
var rg = Object.freeze({
    __proto__: null,
    schema: Zp,
    sanitize: eg,
    format: tg,
    normalize: ng
});
const og = L("div", {
        $flexCenter: "",
        position: "relative",
        "> svg": {
            pointerEvents: "none",
            position: "absolute",
            right: "$md"
        }
    }),
    lo = L("select", {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        opacity: 0
    }),
    ig = L("div", {
        display: "flex",
        alignItems: "center",
        width: "100%",
        height: "$rowHeight",
        backgroundColor: "$elevation3",
        borderRadius: "$sm",
        padding: "0 $sm",
        cursor: "pointer",
        [`${lo}:focus + &`]: {
            $focusStyle: ""
        },
        [`${lo}:hover + &`]: {
            $hoverStyle: ""
        }
    });

function sg({
    displayValue: e,
    value: t,
    onUpdate: n,
    id: r,
    settings: o,
    disabled: i
}) {
    const {
        keys: s,
        values: a
    } = o, c = g.useRef();
    return t === a[e] && (c.current = s[e]), y.createElement(og, null, y.createElement(lo, {
        id: r,
        value: e,
        onChange: l => n(a[Number(l.currentTarget.value)]),
        disabled: i
    }, s.map((l, u) => y.createElement("option", {
        key: l,
        value: u
    }, l))), y.createElement(ig, null, c.current), y.createElement(zo, {
        toggled: !0
    }))
}

function ag() {
    const {
        label: e,
        value: t,
        displayValue: n,
        onUpdate: r,
        id: o,
        disabled: i,
        settings: s
    } = ie();
    return y.createElement(ye, {
        input: !0
    }, y.createElement($e, null, e), y.createElement(sg, {
        id: o,
        value: t,
        displayValue: n,
        onUpdate: r,
        settings: s,
        disabled: i
    }))
}
var cg = F({
    component: ag
}, rg);
const lg = e => fe().string().test(e),
    ug = e => {
        if (typeof e != "string") throw Error("Invalid string");
        return e
    },
    fg = ({
        value: e,
        editable: t = !0,
        rows: n = !1
    }) => ({
        value: e,
        settings: {
            editable: t,
            rows: typeof n == "number" ? n : n ? 5 : 0
        }
    });
var dg = Object.freeze({
    __proto__: null,
    schema: lg,
    sanitize: ug,
    normalize: fg
});
const hg = ["displayValue", "onUpdate", "onChange", "editable"],
    pg = L("div", {
        whiteSpace: "pre-wrap"
    });

function gg(e) {
    let {
        displayValue: t,
        onUpdate: n,
        onChange: r,
        editable: o = !0
    } = e, i = K(e, hg);
    return o ? y.createElement(No, J({
        value: t,
        onUpdate: n,
        onChange: r
    }, i)) : y.createElement(pg, null, t)
}

function mg() {
    const {
        label: e,
        settings: t,
        displayValue: n,
        onUpdate: r,
        onChange: o
    } = ie();
    return y.createElement(ye, {
        input: !0
    }, y.createElement($e, null, e), y.createElement(gg, J({
        displayValue: n,
        onUpdate: r,
        onChange: o
    }, t)))
}
var vg = F({
    component: mg
}, dg);
const bg = e => fe().boolean().test(e),
    yg = e => {
        if (typeof e != "boolean") throw Error("Invalid boolean");
        return e
    };
var _g = Object.freeze({
    __proto__: null,
    schema: bg,
    sanitize: yg
});
const xg = L("div", {
    position: "relative",
    $flex: "",
    height: "$rowHeight",
    input: {
        $reset: "",
        height: 0,
        width: 0,
        opacity: 0,
        margin: 0
    },
    label: {
        position: "relative",
        $flexCenter: "",
        userSelect: "none",
        cursor: "pointer",
        height: "$checkboxSize",
        width: "$checkboxSize",
        backgroundColor: "$elevation3",
        borderRadius: "$sm",
        $hover: ""
    },
    "input:focus + label": {
        $focusStyle: ""
    },
    "input:focus:checked + label, input:checked + label:hover": {
        $hoverStyle: "$accent3"
    },
    "input + label:active": {
        backgroundColor: "$accent1"
    },
    "input:checked + label:active": {
        backgroundColor: "$accent1"
    },
    "label > svg": {
        display: "none",
        width: "90%",
        height: "90%",
        stroke: "$highlight3"
    },
    "input:checked + label": {
        backgroundColor: "$accent2"
    },
    "input:checked + label > svg": {
        display: "block"
    }
});

function wg({
    value: e,
    onUpdate: t,
    id: n,
    disabled: r
}) {
    return y.createElement(xg, null, y.createElement("input", {
        id: n,
        type: "checkbox",
        checked: e,
        onChange: o => t(o.currentTarget.checked),
        disabled: r
    }), y.createElement("label", {
        htmlFor: n
    }, y.createElement("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24"
    }, y.createElement("path", {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M5 13l4 4L19 7"
    }))))
}

function Eg() {
    const {
        label: e,
        value: t,
        onUpdate: n,
        disabled: r,
        id: o
    } = ie();
    return y.createElement(ye, {
        input: !0
    }, y.createElement($e, null, e), y.createElement(wg, {
        value: t,
        onUpdate: n,
        id: o,
        disabled: r
    }))
}
var $g = F({
    component: Eg
}, _g);
const Sg = ["locked"];

function Cg({
    value: e,
    id: t,
    valueKey: n,
    settings: r,
    onUpdate: o,
    innerLabelTrim: i
}) {
    const s = g.useRef(e[n]);
    s.current = e[n];
    const a = g.useCallback(l => o({
            [n]: cc({
                type: "NUMBER",
                value: s.current,
                settings: r
            }, l)
        }), [o, r, n]),
        c = Sc({
            type: "NUMBER",
            value: e[n],
            settings: r,
            setValue: a
        });
    return y.createElement(kc, {
        id: t,
        label: n,
        value: e[n],
        displayValue: c.displayValue,
        onUpdate: c.onUpdate,
        onChange: c.onChange,
        settings: r,
        innerLabelTrim: i
    })
}
const Tg = L("div", {
    display: "grid",
    columnGap: "$colGap",
    gridAutoFlow: "column dense",
    alignItems: "center",
    variants: {
        withLock: {
            true: {
                gridTemplateColumns: "10px auto",
                "> svg": {
                    cursor: "pointer"
                }
            }
        }
    }
});

function Rg(e) {
    let {
        locked: t
    } = e, n = K(e, Sg);
    return y.createElement("svg", J({
        width: "10",
        height: "10",
        viewBox: "0 0 15 15",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg"
    }, n), t ? y.createElement("path", {
        d: "M5 4.63601C5 3.76031 5.24219 3.1054 5.64323 2.67357C6.03934 2.24705 6.64582 1.9783 7.5014 1.9783C8.35745 1.9783 8.96306 2.24652 9.35823 2.67208C9.75838 3.10299 10 3.75708 10 4.63325V5.99999H5V4.63601ZM4 5.99999V4.63601C4 3.58148 4.29339 2.65754 4.91049 1.99307C5.53252 1.32329 6.42675 0.978302 7.5014 0.978302C8.57583 0.978302 9.46952 1.32233 10.091 1.99162C10.7076 2.65557 11 3.57896 11 4.63325V5.99999H12C12.5523 5.99999 13 6.44771 13 6.99999V13C13 13.5523 12.5523 14 12 14H3C2.44772 14 2 13.5523 2 13V6.99999C2 6.44771 2.44772 5.99999 3 5.99999H4ZM3 6.99999H12V13H3V6.99999Z",
        fill: "currentColor",
        fillRule: "evenodd",
        clipRule: "evenodd"
    }) : y.createElement("path", {
        d: "M9 3.63601C9 2.76044 9.24207 2.11211 9.64154 1.68623C10.0366 1.26502 10.6432 1 11.5014 1C12.4485 1 13.0839 1.30552 13.4722 1.80636C13.8031 2.23312 14 2.84313 14 3.63325H15C15 2.68242 14.7626 1.83856 14.2625 1.19361C13.6389 0.38943 12.6743 0 11.5014 0C10.4294 0 9.53523 0.337871 8.91218 1.0021C8.29351 1.66167 8 2.58135 8 3.63601V6H1C0.447715 6 0 6.44772 0 7V13C0 13.5523 0.447715 14 1 14H10C10.5523 14 11 13.5523 11 13V7C11 6.44772 10.5523 6 10 6H9V3.63601ZM1 7H10V13H1V7Z",
        fill: "currentColor",
        fillRule: "evenodd",
        clipRule: "evenodd"
    }))
}

function Wo({
    value: e,
    onUpdate: t,
    settings: n,
    innerLabelTrim: r
}) {
    const {
        id: o,
        setSettings: i
    } = ie(), {
        lock: s,
        locked: a
    } = n;
    return y.createElement(Tg, {
        withLock: s
    }, s && y.createElement(Rg, {
        locked: a,
        onClick: () => i({
            locked: !a
        })
    }), Object.keys(e).map((c, l) => y.createElement(Cg, {
        id: l === 0 ? o : `${o}.${c}`,
        key: c,
        valueKey: c,
        value: e,
        settings: n[c],
        onUpdate: t,
        innerLabelTrim: r
    })))
}
const Ic = (e, t) => {
        const n = {};
        let r = 0,
            o = 1 / 0;
        Object.entries(e).forEach(([i, s]) => {
            n[i] = dc(F({
                value: s
            }, t[i])).settings, r = Math.max(r, n[i].step), o = Math.min(o, n[i].pad)
        });
        for (let i in n) {
            const {
                step: s,
                min: a,
                max: c
            } = t[i] || {};
            !isFinite(s) && (!isFinite(a) || !isFinite(c)) && (n[i].step = r, n[i].pad = o)
        }
        return n
    },
    Og = ["lock"],
    kg = ["value"];

function Ig(e) {
    const t = fe().array().length(e).every.number(),
        n = r => {
            if (!r || typeof r != "object") return !1;
            const o = Object.values(r);
            return o.length === e && o.every(i => isFinite(i))
        };
    return r => t.test(r) || n(r)
}

function Pg(e) {
    return Array.isArray(e) ? "array" : "object"
}

function Mt(e, t, n) {
    return Pg(e) === t ? e : t === "array" ? Object.values(e) : up(e, n)
}
const Ag = (e, t, n) => {
        const r = Mt(e, "object", t.keys);
        for (let s in r) r[s] = fc(r[s], t[s]);
        const o = Object.keys(r);
        let i = {};
        if (o.length === t.keys.length) i = r;
        else {
            const s = Mt(n, "object", t.keys);
            if (o.length === 1 && t.locked) {
                const a = o[0],
                    c = r[a],
                    l = s[a],
                    u = l !== 0 ? c / l : 1;
                for (let f in s) f === a ? i[a] = c : i[f] = s[f] * u
            } else i = F(F({}, s), r)
        }
        return Mt(i, t.format, t.keys)
    },
    Dg = (e, t) => Mt(e, "object", t.keys),
    Mg = e => !!e && ("step" in e || "min" in e || "max" in e);

function jg(e, t, n = []) {
    const {
        lock: r = !1
    } = t, o = K(t, Og), i = Array.isArray(e) ? "array" : "object", s = i === "object" ? Object.keys(e) : n, a = Mt(e, "object", s), c = Mg(o) ? s.reduce((u, f) => Object.assign(u, {
        [f]: o
    }), {}) : o, l = Ic(a, c);
    return {
        value: i === "array" ? e : a,
        settings: F(F({}, l), {}, {
            format: i,
            keys: s,
            lock: r,
            locked: !1
        })
    }
}

function Pc(e) {
    return {
        schema: Ig(e.length),
        normalize: t => {
            let {
                value: n
            } = t, r = K(t, kg);
            return jg(n, r, e)
        },
        format: (t, n) => Dg(t, n),
        sanitize: (t, n, r) => Ag(t, n, r)
    }
}
var Lg = {
        grad: .9,
        turn: 360,
        rad: 360 / (2 * Math.PI)
    },
    Me = function(e) {
        return typeof e == "string" ? e.length > 0 : typeof e == "number"
    },
    ne = function(e, t, n) {
        return t === void 0 && (t = 0), n === void 0 && (n = Math.pow(10, t)), Math.round(n * e) / n + 0
    },
    be = function(e, t, n) {
        return t === void 0 && (t = 0), n === void 0 && (n = 1), e > n ? n : e > t ? e : t
    },
    Ac = function(e) {
        return (e = isFinite(e) ? e % 360 : 0) > 0 ? e : e + 360
    },
    Wi = function(e) {
        return {
            r: be(e.r, 0, 255),
            g: be(e.g, 0, 255),
            b: be(e.b, 0, 255),
            a: be(e.a)
        }
    },
    yr = function(e) {
        return {
            r: ne(e.r),
            g: ne(e.g),
            b: ne(e.b),
            a: ne(e.a, 3)
        }
    },
    Ng = /^#([0-9a-f]{3,8})$/i,
    bn = function(e) {
        var t = e.toString(16);
        return t.length < 2 ? "0" + t : t
    },
    Dc = function(e) {
        var t = e.r,
            n = e.g,
            r = e.b,
            o = e.a,
            i = Math.max(t, n, r),
            s = i - Math.min(t, n, r),
            a = s ? i === t ? (n - r) / s : i === n ? 2 + (r - t) / s : 4 + (t - n) / s : 0;
        return {
            h: 60 * (a < 0 ? a + 6 : a),
            s: i ? s / i * 100 : 0,
            v: i / 255 * 100,
            a: o
        }
    },
    Mc = function(e) {
        var t = e.h,
            n = e.s,
            r = e.v,
            o = e.a;
        t = t / 360 * 6, n /= 100, r /= 100;
        var i = Math.floor(t),
            s = r * (1 - n),
            a = r * (1 - (t - i) * n),
            c = r * (1 - (1 - t + i) * n),
            l = i % 6;
        return {
            r: 255 * [r, a, s, s, c, r][l],
            g: 255 * [c, r, r, a, s, s][l],
            b: 255 * [s, s, c, r, r, a][l],
            a: o
        }
    },
    Bi = function(e) {
        return {
            h: Ac(e.h),
            s: be(e.s, 0, 100),
            l: be(e.l, 0, 100),
            a: be(e.a)
        }
    },
    Hi = function(e) {
        return {
            h: ne(e.h),
            s: ne(e.s),
            l: ne(e.l),
            a: ne(e.a, 3)
        }
    },
    Vi = function(e) {
        return Mc((n = (t = e).s, {
            h: t.h,
            s: (n *= ((r = t.l) < 50 ? r : 100 - r) / 100) > 0 ? 2 * n / (r + n) * 100 : 0,
            v: r + n,
            a: t.a
        }));
        var t, n, r
    },
    jt = function(e) {
        return {
            h: (t = Dc(e)).h,
            s: (o = (200 - (n = t.s)) * (r = t.v) / 100) > 0 && o < 200 ? n * r / 100 / (o <= 100 ? o : 200 - o) * 100 : 0,
            l: o / 2,
            a: t.a
        };
        var t, n, r, o
    },
    Fg = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s*,\s*([+-]?\d*\.?\d+)%\s*,\s*([+-]?\d*\.?\d+)%\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i,
    zg = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s+([+-]?\d*\.?\d+)%\s+([+-]?\d*\.?\d+)%\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i,
    Wg = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i,
    Bg = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i,
    uo = {
        string: [
            [function(e) {
                var t = Ng.exec(e);
                return t ? (e = t[1]).length <= 4 ? {
                    r: parseInt(e[0] + e[0], 16),
                    g: parseInt(e[1] + e[1], 16),
                    b: parseInt(e[2] + e[2], 16),
                    a: e.length === 4 ? ne(parseInt(e[3] + e[3], 16) / 255, 2) : 1
                } : e.length === 6 || e.length === 8 ? {
                    r: parseInt(e.substr(0, 2), 16),
                    g: parseInt(e.substr(2, 2), 16),
                    b: parseInt(e.substr(4, 2), 16),
                    a: e.length === 8 ? ne(parseInt(e.substr(6, 2), 16) / 255, 2) : 1
                } : null : null
            }, "hex"],
            [function(e) {
                var t = Wg.exec(e) || Bg.exec(e);
                return t ? t[2] !== t[4] || t[4] !== t[6] ? null : Wi({
                    r: Number(t[1]) / (t[2] ? 100 / 255 : 1),
                    g: Number(t[3]) / (t[4] ? 100 / 255 : 1),
                    b: Number(t[5]) / (t[6] ? 100 / 255 : 1),
                    a: t[7] === void 0 ? 1 : Number(t[7]) / (t[8] ? 100 : 1)
                }) : null
            }, "rgb"],
            [function(e) {
                var t = Fg.exec(e) || zg.exec(e);
                if (!t) return null;
                var n, r, o = Bi({
                    h: (n = t[1], r = t[2], r === void 0 && (r = "deg"), Number(n) * (Lg[r] || 1)),
                    s: Number(t[3]),
                    l: Number(t[4]),
                    a: t[5] === void 0 ? 1 : Number(t[5]) / (t[6] ? 100 : 1)
                });
                return Vi(o)
            }, "hsl"]
        ],
        object: [
            [function(e) {
                var t = e.r,
                    n = e.g,
                    r = e.b,
                    o = e.a,
                    i = o === void 0 ? 1 : o;
                return Me(t) && Me(n) && Me(r) ? Wi({
                    r: Number(t),
                    g: Number(n),
                    b: Number(r),
                    a: Number(i)
                }) : null
            }, "rgb"],
            [function(e) {
                var t = e.h,
                    n = e.s,
                    r = e.l,
                    o = e.a,
                    i = o === void 0 ? 1 : o;
                if (!Me(t) || !Me(n) || !Me(r)) return null;
                var s = Bi({
                    h: Number(t),
                    s: Number(n),
                    l: Number(r),
                    a: Number(i)
                });
                return Vi(s)
            }, "hsl"],
            [function(e) {
                var t = e.h,
                    n = e.s,
                    r = e.v,
                    o = e.a,
                    i = o === void 0 ? 1 : o;
                if (!Me(t) || !Me(n) || !Me(r)) return null;
                var s = (function(a) {
                    return {
                        h: Ac(a.h),
                        s: be(a.s, 0, 100),
                        v: be(a.v, 0, 100),
                        a: be(a.a)
                    }
                })({
                    h: Number(t),
                    s: Number(n),
                    v: Number(r),
                    a: Number(i)
                });
                return Mc(s)
            }, "hsv"]
        ]
    },
    Ui = function(e, t) {
        for (var n = 0; n < t.length; n++) {
            var r = t[n][0](e);
            if (r) return [r, t[n][1]]
        }
        return [null, void 0]
    },
    jc = function(e) {
        return typeof e == "string" ? Ui(e.trim(), uo.string) : typeof e == "object" && e !== null ? Ui(e, uo.object) : [null, void 0]
    },
    Hg = function(e) {
        return jc(e)[1]
    },
    _r = function(e, t) {
        var n = jt(e);
        return {
            h: n.h,
            s: be(n.s + 100 * t, 0, 100),
            l: n.l,
            a: n.a
        }
    },
    xr = function(e) {
        return (299 * e.r + 587 * e.g + 114 * e.b) / 1e3 / 255
    },
    qi = function(e, t) {
        var n = jt(e);
        return {
            h: n.h,
            s: n.s,
            l: be(n.l + 100 * t, 0, 100),
            a: n.a
        }
    },
    fo = (function() {
        function e(t) {
            this.parsed = jc(t)[0], this.rgba = this.parsed || {
                r: 0,
                g: 0,
                b: 0,
                a: 1
            }
        }
        return e.prototype.isValid = function() {
            return this.parsed !== null
        }, e.prototype.brightness = function() {
            return ne(xr(this.rgba), 2)
        }, e.prototype.isDark = function() {
            return xr(this.rgba) < .5
        }, e.prototype.isLight = function() {
            return xr(this.rgba) >= .5
        }, e.prototype.toHex = function() {
            return t = yr(this.rgba), n = t.r, r = t.g, o = t.b, s = (i = t.a) < 1 ? bn(ne(255 * i)) : "", "#" + bn(n) + bn(r) + bn(o) + s;
            var t, n, r, o, i, s
        }, e.prototype.toRgb = function() {
            return yr(this.rgba)
        }, e.prototype.toRgbString = function() {
            return t = yr(this.rgba), n = t.r, r = t.g, o = t.b, (i = t.a) < 1 ? "rgba(" + n + ", " + r + ", " + o + ", " + i + ")" : "rgb(" + n + ", " + r + ", " + o + ")";
            var t, n, r, o, i
        }, e.prototype.toHsl = function() {
            return Hi(jt(this.rgba))
        }, e.prototype.toHslString = function() {
            return t = Hi(jt(this.rgba)), n = t.h, r = t.s, o = t.l, (i = t.a) < 1 ? "hsla(" + n + ", " + r + "%, " + o + "%, " + i + ")" : "hsl(" + n + ", " + r + "%, " + o + "%)";
            var t, n, r, o, i
        }, e.prototype.toHsv = function() {
            return t = Dc(this.rgba), {
                h: ne(t.h),
                s: ne(t.s),
                v: ne(t.v),
                a: ne(t.a, 3)
            };
            var t
        }, e.prototype.invert = function() {
            return ce({
                r: 255 - (t = this.rgba).r,
                g: 255 - t.g,
                b: 255 - t.b,
                a: t.a
            });
            var t
        }, e.prototype.saturate = function(t) {
            return t === void 0 && (t = .1), ce(_r(this.rgba, t))
        }, e.prototype.desaturate = function(t) {
            return t === void 0 && (t = .1), ce(_r(this.rgba, -t))
        }, e.prototype.grayscale = function() {
            return ce(_r(this.rgba, -1))
        }, e.prototype.lighten = function(t) {
            return t === void 0 && (t = .1), ce(qi(this.rgba, t))
        }, e.prototype.darken = function(t) {
            return t === void 0 && (t = .1), ce(qi(this.rgba, -t))
        }, e.prototype.rotate = function(t) {
            return t === void 0 && (t = 15), this.hue(this.hue() + t)
        }, e.prototype.alpha = function(t) {
            return typeof t == "number" ? ce({
                r: (n = this.rgba).r,
                g: n.g,
                b: n.b,
                a: t
            }) : ne(this.rgba.a, 3);
            var n
        }, e.prototype.hue = function(t) {
            var n = jt(this.rgba);
            return typeof t == "number" ? ce({
                h: t,
                s: n.s,
                l: n.l,
                a: n.a
            }) : ne(n.h)
        }, e.prototype.isEqual = function(t) {
            return this.toHex() === ce(t).toHex()
        }, e
    })(),
    ce = function(e) {
        return e instanceof fo ? e : new fo(e)
    },
    Ki = [],
    Vg = function(e) {
        e.forEach(function(t) {
            Ki.indexOf(t) < 0 && (t(fo, uo), Ki.push(t))
        })
    };

function Ug(e, t) {
    var n = {
            white: "#ffffff",
            bisque: "#ffe4c4",
            blue: "#0000ff",
            cadetblue: "#5f9ea0",
            chartreuse: "#7fff00",
            chocolate: "#d2691e",
            coral: "#ff7f50",
            antiquewhite: "#faebd7",
            aqua: "#00ffff",
            azure: "#f0ffff",
            whitesmoke: "#f5f5f5",
            papayawhip: "#ffefd5",
            plum: "#dda0dd",
            blanchedalmond: "#ffebcd",
            black: "#000000",
            gold: "#ffd700",
            goldenrod: "#daa520",
            gainsboro: "#dcdcdc",
            cornsilk: "#fff8dc",
            cornflowerblue: "#6495ed",
            burlywood: "#deb887",
            aquamarine: "#7fffd4",
            beige: "#f5f5dc",
            crimson: "#dc143c",
            cyan: "#00ffff",
            darkblue: "#00008b",
            darkcyan: "#008b8b",
            darkgoldenrod: "#b8860b",
            darkkhaki: "#bdb76b",
            darkgray: "#a9a9a9",
            darkgreen: "#006400",
            darkgrey: "#a9a9a9",
            peachpuff: "#ffdab9",
            darkmagenta: "#8b008b",
            darkred: "#8b0000",
            darkorchid: "#9932cc",
            darkorange: "#ff8c00",
            darkslateblue: "#483d8b",
            gray: "#808080",
            darkslategray: "#2f4f4f",
            darkslategrey: "#2f4f4f",
            deeppink: "#ff1493",
            deepskyblue: "#00bfff",
            wheat: "#f5deb3",
            firebrick: "#b22222",
            floralwhite: "#fffaf0",
            ghostwhite: "#f8f8ff",
            darkviolet: "#9400d3",
            magenta: "#ff00ff",
            green: "#008000",
            dodgerblue: "#1e90ff",
            grey: "#808080",
            honeydew: "#f0fff0",
            hotpink: "#ff69b4",
            blueviolet: "#8a2be2",
            forestgreen: "#228b22",
            lawngreen: "#7cfc00",
            indianred: "#cd5c5c",
            indigo: "#4b0082",
            fuchsia: "#ff00ff",
            brown: "#a52a2a",
            maroon: "#800000",
            mediumblue: "#0000cd",
            lightcoral: "#f08080",
            darkturquoise: "#00ced1",
            lightcyan: "#e0ffff",
            ivory: "#fffff0",
            lightyellow: "#ffffe0",
            lightsalmon: "#ffa07a",
            lightseagreen: "#20b2aa",
            linen: "#faf0e6",
            mediumaquamarine: "#66cdaa",
            lemonchiffon: "#fffacd",
            lime: "#00ff00",
            khaki: "#f0e68c",
            mediumseagreen: "#3cb371",
            limegreen: "#32cd32",
            mediumspringgreen: "#00fa9a",
            lightskyblue: "#87cefa",
            lightblue: "#add8e6",
            midnightblue: "#191970",
            lightpink: "#ffb6c1",
            mistyrose: "#ffe4e1",
            moccasin: "#ffe4b5",
            mintcream: "#f5fffa",
            lightslategray: "#778899",
            lightslategrey: "#778899",
            navajowhite: "#ffdead",
            navy: "#000080",
            mediumvioletred: "#c71585",
            powderblue: "#b0e0e6",
            palegoldenrod: "#eee8aa",
            oldlace: "#fdf5e6",
            paleturquoise: "#afeeee",
            mediumturquoise: "#48d1cc",
            mediumorchid: "#ba55d3",
            rebeccapurple: "#663399",
            lightsteelblue: "#b0c4de",
            mediumslateblue: "#7b68ee",
            thistle: "#d8bfd8",
            tan: "#d2b48c",
            orchid: "#da70d6",
            mediumpurple: "#9370db",
            purple: "#800080",
            pink: "#ffc0cb",
            skyblue: "#87ceeb",
            springgreen: "#00ff7f",
            palegreen: "#98fb98",
            red: "#ff0000",
            yellow: "#ffff00",
            slateblue: "#6a5acd",
            lavenderblush: "#fff0f5",
            peru: "#cd853f",
            palevioletred: "#db7093",
            violet: "#ee82ee",
            teal: "#008080",
            slategray: "#708090",
            slategrey: "#708090",
            aliceblue: "#f0f8ff",
            darkseagreen: "#8fbc8f",
            darkolivegreen: "#556b2f",
            greenyellow: "#adff2f",
            seagreen: "#2e8b57",
            seashell: "#fff5ee",
            tomato: "#ff6347",
            silver: "#c0c0c0",
            sienna: "#a0522d",
            lavender: "#e6e6fa",
            lightgreen: "#90ee90",
            orange: "#ffa500",
            orangered: "#ff4500",
            steelblue: "#4682b4",
            royalblue: "#4169e1",
            turquoise: "#40e0d0",
            yellowgreen: "#9acd32",
            salmon: "#fa8072",
            saddlebrown: "#8b4513",
            sandybrown: "#f4a460",
            rosybrown: "#bc8f8f",
            darksalmon: "#e9967a",
            lightgoldenrodyellow: "#fafad2",
            snow: "#fffafa",
            lightgrey: "#d3d3d3",
            lightgray: "#d3d3d3",
            dimgray: "#696969",
            dimgrey: "#696969",
            olivedrab: "#6b8e23",
            olive: "#808000"
        },
        r = {};
    for (var o in n) r[n[o]] = o;
    var i = {};
    e.prototype.toName = function(s) {
        if (!(this.rgba.a || this.rgba.r || this.rgba.g || this.rgba.b)) return "transparent";
        var a, c, l = r[this.toHex()];
        if (l) return l;
        if (s ?.closest) {
            var u = this.toRgb(),
                f = 1 / 0,
                d = "black";
            if (!i.length)
                for (var h in n) i[h] = new e(n[h]).toRgb();
            for (var p in n) {
                var m = (a = u, c = i[p], Math.pow(a.r - c.r, 2) + Math.pow(a.g - c.g, 2) + Math.pow(a.b - c.b, 2));
                m < f && (f = m, d = p)
            }
            return d
        }
    }, t.string.push([function(s) {
        var a = s.toLowerCase(),
            c = a === "transparent" ? "#0000" : n[a];
        return c ? new e(c).toRgb() : null
    }, "name"])
}

function Tt() {
    return (Tt = Object.assign || function(e) {
        for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t];
            for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r])
        }
        return e
    }).apply(this, arguments)
}

function Bo(e, t) {
    if (e == null) return {};
    var n, r, o = {},
        i = Object.keys(e);
    for (r = 0; r < i.length; r++) t.indexOf(n = i[r]) >= 0 || (o[n] = e[n]);
    return o
}

function ho(e) {
    var t = g.useRef(e),
        n = g.useRef(function(r) {
            t.current && t.current(r)
        });
    return t.current = e, n.current
}
var xt = function(e, t, n) {
        return t === void 0 && (t = 0), n === void 0 && (n = 1), e > n ? n : e < t ? t : e
    },
    Lt = function(e) {
        return "touches" in e
    },
    po = function(e) {
        return e && e.ownerDocument.defaultView || self
    },
    Gi = function(e, t, n) {
        var r = e.getBoundingClientRect(),
            o = Lt(t) ? (function(i, s) {
                for (var a = 0; a < i.length; a++)
                    if (i[a].identifier === s) return i[a];
                return i[0]
            })(t.touches, n) : t;
        return {
            left: xt((o.pageX - (r.left + po(e).pageXOffset)) / r.width),
            top: xt((o.pageY - (r.top + po(e).pageYOffset)) / r.height)
        }
    },
    Yi = function(e) {
        !Lt(e) && e.preventDefault()
    },
    Ho = y.memo(function(e) {
        var t = e.onMove,
            n = e.onKey,
            r = Bo(e, ["onMove", "onKey"]),
            o = g.useRef(null),
            i = ho(t),
            s = ho(n),
            a = g.useRef(null),
            c = g.useRef(!1),
            l = g.useMemo(function() {
                var h = function(v) {
                        Yi(v), (Lt(v) ? v.touches.length > 0 : v.buttons > 0) && o.current ? i(Gi(o.current, v, a.current)) : m(!1)
                    },
                    p = function() {
                        return m(!1)
                    };

                function m(v) {
                    var b = c.current,
                        _ = po(o.current),
                        x = v ? _.addEventListener : _.removeEventListener;
                    x(b ? "touchmove" : "mousemove", h), x(b ? "touchend" : "mouseup", p)
                }
                return [function(v) {
                    var b = v.nativeEvent,
                        _ = o.current;
                    if (_ && (Yi(b), !(function(w, C) {
                            return C && !Lt(w)
                        })(b, c.current) && _)) {
                        if (Lt(b)) {
                            c.current = !0;
                            var x = b.changedTouches || [];
                            x.length && (a.current = x[0].identifier)
                        }
                        _.focus(), i(Gi(_, b, a.current)), m(!0)
                    }
                }, function(v) {
                    var b = v.which || v.keyCode;
                    b < 37 || b > 40 || (v.preventDefault(), s({
                        left: b === 39 ?.05 : b === 37 ? -.05 : 0,
                        top: b === 40 ?.05 : b === 38 ? -.05 : 0
                    }))
                }, m]
            }, [s, i]),
            u = l[0],
            f = l[1],
            d = l[2];
        return g.useEffect(function() {
            return d
        }, [d]), y.createElement("div", Tt({}, r, {
            onTouchStart: u,
            onMouseDown: u,
            className: "react-colorful__interactive",
            ref: o,
            onKeyDown: f,
            tabIndex: 0,
            role: "slider"
        }))
    }),
    en = function(e) {
        return e.filter(Boolean).join(" ")
    },
    Vo = function(e) {
        var t = e.color,
            n = e.left,
            r = e.top,
            o = r === void 0 ?.5 : r,
            i = en(["react-colorful__pointer", e.className]);
        return y.createElement("div", {
            className: i,
            style: {
                top: 100 * o + "%",
                left: 100 * n + "%"
            }
        }, y.createElement("div", {
            className: "react-colorful__pointer-fill",
            style: {
                backgroundColor: t
            }
        }))
    },
    le = function(e, t, n) {
        return t === void 0 && (t = 0), n === void 0 && (n = Math.pow(10, t)), Math.round(n * e) / n
    },
    Lc = function(e) {
        var t = e.s,
            n = e.v,
            r = e.a,
            o = (200 - t) * n / 100;
        return {
            h: le(e.h),
            s: le(o > 0 && o < 200 ? t * n / 100 / (o <= 100 ? o : 200 - o) * 100 : 0),
            l: le(o / 2),
            a: le(r, 2)
        }
    },
    go = function(e) {
        var t = Lc(e);
        return "hsl(" + t.h + ", " + t.s + "%, " + t.l + "%)"
    },
    wr = function(e) {
        var t = Lc(e);
        return "hsla(" + t.h + ", " + t.s + "%, " + t.l + "%, " + t.a + ")"
    },
    Nc = function(e) {
        var t = e.h,
            n = e.s,
            r = e.v,
            o = e.a;
        t = t / 360 * 6, n /= 100, r /= 100;
        var i = Math.floor(t),
            s = r * (1 - n),
            a = r * (1 - (t - i) * n),
            c = r * (1 - (1 - t + i) * n),
            l = i % 6;
        return {
            r: le(255 * [r, a, s, s, c, r][l]),
            g: le(255 * [c, r, r, a, s, s][l]),
            b: le(255 * [s, s, c, r, r, a][l]),
            a: le(o, 2)
        }
    },
    Fc = function(e) {
        var t = e.r,
            n = e.g,
            r = e.b,
            o = e.a,
            i = Math.max(t, n, r),
            s = i - Math.min(t, n, r),
            a = s ? i === t ? (n - r) / s : i === n ? 2 + (r - t) / s : 4 + (t - n) / s : 0;
        return {
            h: le(60 * (a < 0 ? a + 6 : a)),
            s: le(i ? s / i * 100 : 0),
            v: le(i / 255 * 100),
            a: o
        }
    },
    zc = y.memo(function(e) {
        var t = e.hue,
            n = e.onChange,
            r = en(["react-colorful__hue", e.className]);
        return y.createElement("div", {
            className: r
        }, y.createElement(Ho, {
            onMove: function(o) {
                n({
                    h: 360 * o.left
                })
            },
            onKey: function(o) {
                n({
                    h: xt(t + 360 * o.left, 0, 360)
                })
            },
            "aria-label": "Hue",
            "aria-valuenow": le(t),
            "aria-valuemax": "360",
            "aria-valuemin": "0"
        }, y.createElement(Vo, {
            className: "react-colorful__hue-pointer",
            left: t / 360,
            color: go({
                h: t,
                s: 100,
                v: 100,
                a: 1
            })
        })))
    }),
    Wc = y.memo(function(e) {
        var t = e.hsva,
            n = e.onChange,
            r = {
                backgroundColor: go({
                    h: t.h,
                    s: 100,
                    v: 100,
                    a: 1
                })
            };
        return y.createElement("div", {
            className: "react-colorful__saturation",
            style: r
        }, y.createElement(Ho, {
            onMove: function(o) {
                n({
                    s: 100 * o.left,
                    v: 100 - 100 * o.top
                })
            },
            onKey: function(o) {
                n({
                    s: xt(t.s + 100 * o.left, 0, 100),
                    v: xt(t.v - 100 * o.top, 0, 100)
                })
            },
            "aria-label": "Color",
            "aria-valuetext": "Saturation " + le(t.s) + "%, Brightness " + le(t.v) + "%"
        }, y.createElement(Vo, {
            className: "react-colorful__saturation-pointer",
            top: 1 - t.v / 100,
            left: t.s / 100,
            color: go(t)
        })))
    }),
    Uo = function(e, t) {
        if (e === t) return !0;
        for (var n in e)
            if (e[n] !== t[n]) return !1;
        return !0
    };

function Bc(e, t, n) {
    var r = ho(n),
        o = g.useState(function() {
            return e.toHsva(t)
        }),
        i = o[0],
        s = o[1],
        a = g.useRef({
            color: t,
            hsva: i
        });
    g.useEffect(function() {
        if (!e.equal(t, a.current.color)) {
            var l = e.toHsva(t);
            a.current = {
                hsva: l,
                color: t
            }, s(l)
        }
    }, [t, e]), g.useEffect(function() {
        var l;
        Uo(i, a.current.hsva) || e.equal(l = e.fromHsva(i), a.current.color) || (a.current = {
            hsva: i,
            color: l
        }, r(l))
    }, [i, e, r]);
    var c = g.useCallback(function(l) {
        s(function(u) {
            return Object.assign({}, u, l)
        })
    }, []);
    return [i, c]
}
var qg = typeof window < "u" ? g.useLayoutEffect : g.useEffect,
    Kg = function() {
        return typeof __webpack_nonce__ < "u" ? __webpack_nonce__ : void 0
    },
    Qi = new Map,
    Hc = function(e) {
        qg(function() {
            var t = e.current ? e.current.ownerDocument : document;
            if (t !== void 0 && !Qi.has(t)) {
                var n = t.createElement("style");
                n.innerHTML = `.react-colorful{position:relative;display:flex;flex-direction:column;width:200px;height:200px;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;cursor:default}.react-colorful__saturation{position:relative;flex-grow:1;border-color:transparent;border-bottom:12px solid #000;border-radius:8px 8px 0 0;background-image:linear-gradient(0deg,#000,transparent),linear-gradient(90deg,#fff,hsla(0,0%,100%,0))}.react-colorful__alpha-gradient,.react-colorful__pointer-fill{content:"";position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;border-radius:inherit}.react-colorful__alpha-gradient,.react-colorful__saturation{box-shadow:inset 0 0 0 1px rgba(0,0,0,.05)}.react-colorful__alpha,.react-colorful__hue{position:relative;height:24px}.react-colorful__hue{background:linear-gradient(90deg,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red)}.react-colorful__last-control{border-radius:0 0 8px 8px}.react-colorful__interactive{position:absolute;left:0;top:0;right:0;bottom:0;border-radius:inherit;outline:none;touch-action:none}.react-colorful__pointer{position:absolute;z-index:1;box-sizing:border-box;width:28px;height:28px;transform:translate(-50%,-50%);background-color:#fff;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,.2)}.react-colorful__interactive:focus .react-colorful__pointer{transform:translate(-50%,-50%) scale(1.1)}.react-colorful__alpha,.react-colorful__alpha-pointer{background-color:#fff;background-image:url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill-opacity=".05"><path d="M8 0h8v8H8zM0 8h8v8H0z"/></svg>')}.react-colorful__saturation-pointer{z-index:3}.react-colorful__hue-pointer{z-index:2}`, Qi.set(t, n);
                var r = Kg();
                r && n.setAttribute("nonce", r), t.head.appendChild(n)
            }
        }, [])
    },
    Gg = function(e) {
        var t = e.className,
            n = e.colorModel,
            r = e.color,
            o = r === void 0 ? n.defaultColor : r,
            i = e.onChange,
            s = Bo(e, ["className", "colorModel", "color", "onChange"]),
            a = g.useRef(null);
        Hc(a);
        var c = Bc(n, o, i),
            l = c[0],
            u = c[1],
            f = en(["react-colorful", t]);
        return y.createElement("div", Tt({}, s, {
            ref: a,
            className: f
        }), y.createElement(Wc, {
            hsva: l,
            onChange: u
        }), y.createElement(zc, {
            hue: l.h,
            onChange: u,
            className: "react-colorful__last-control"
        }))
    },
    Yg = function(e) {
        var t = e.className,
            n = e.hsva,
            r = e.onChange,
            o = {
                backgroundImage: "linear-gradient(90deg, " + wr(Object.assign({}, n, {
                    a: 0
                })) + ", " + wr(Object.assign({}, n, {
                    a: 1
                })) + ")"
            },
            i = en(["react-colorful__alpha", t]),
            s = le(100 * n.a);
        return y.createElement("div", {
            className: i
        }, y.createElement("div", {
            className: "react-colorful__alpha-gradient",
            style: o
        }), y.createElement(Ho, {
            onMove: function(a) {
                r({
                    a: a.left
                })
            },
            onKey: function(a) {
                r({
                    a: xt(n.a + a.left)
                })
            },
            "aria-label": "Alpha",
            "aria-valuetext": s + "%",
            "aria-valuenow": s,
            "aria-valuemin": "0",
            "aria-valuemax": "100"
        }, y.createElement(Vo, {
            className: "react-colorful__alpha-pointer",
            left: n.a,
            color: wr(n)
        })))
    },
    Qg = function(e) {
        var t = e.className,
            n = e.colorModel,
            r = e.color,
            o = r === void 0 ? n.defaultColor : r,
            i = e.onChange,
            s = Bo(e, ["className", "colorModel", "color", "onChange"]),
            a = g.useRef(null);
        Hc(a);
        var c = Bc(n, o, i),
            l = c[0],
            u = c[1],
            f = en(["react-colorful", t]);
        return y.createElement("div", Tt({}, s, {
            ref: a,
            className: f
        }), y.createElement(Wc, {
            hsva: l,
            onChange: u
        }), y.createElement(zc, {
            hue: l.h,
            onChange: u
        }), y.createElement(Yg, {
            hsva: l,
            onChange: u,
            className: "react-colorful__last-control"
        }))
    },
    Xg = {
        defaultColor: {
            r: 0,
            g: 0,
            b: 0,
            a: 1
        },
        toHsva: Fc,
        fromHsva: Nc,
        equal: Uo
    },
    Jg = function(e) {
        return y.createElement(Qg, Tt({}, e, {
            colorModel: Xg
        }))
    },
    Zg = {
        defaultColor: {
            r: 0,
            g: 0,
            b: 0
        },
        toHsva: function(e) {
            return Fc({
                r: e.r,
                g: e.g,
                b: e.b,
                a: 1
            })
        },
        fromHsva: function(e) {
            return {
                r: (t = Nc(e)).r,
                g: t.g,
                b: t.b
            };
            var t
        },
        equal: Uo
    },
    em = function(e) {
        return y.createElement(Gg, Tt({}, e, {
            colorModel: Zg
        }))
    },
    Er = {
        exports: {}
    },
    $r, Xi;

function tm() {
    if (Xi) return $r;
    Xi = 1;
    var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
    return $r = e, $r
}
var Sr, Ji;

function nm() {
    if (Ji) return Sr;
    Ji = 1;
    var e = tm();

    function t() {}

    function n() {}
    return n.resetWarningCache = t, Sr = function() {
        function r(s, a, c, l, u, f) {
            if (f !== e) {
                var d = new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");
                throw d.name = "Invariant Violation", d
            }
        }
        r.isRequired = r;

        function o() {
            return r
        }
        var i = {
            array: r,
            bigint: r,
            bool: r,
            func: r,
            number: r,
            object: r,
            string: r,
            symbol: r,
            any: r,
            arrayOf: o,
            element: r,
            elementType: r,
            instanceOf: o,
            node: r,
            objectOf: o,
            oneOf: o,
            oneOfType: o,
            shape: o,
            exact: o,
            checkPropTypes: n,
            resetWarningCache: t
        };
        return i.PropTypes = i, i
    }, Sr
}
var Zi;

function rm() {
    return Zi || (Zi = 1, Er.exports = nm()()), Er.exports
}
var om = rm();
const G = qt(om);
var im = new Map([
    ["aac", "audio/aac"],
    ["abw", "application/x-abiword"],
    ["arc", "application/x-freearc"],
    ["avif", "image/avif"],
    ["avi", "video/x-msvideo"],
    ["azw", "application/vnd.amazon.ebook"],
    ["bin", "application/octet-stream"],
    ["bmp", "image/bmp"],
    ["bz", "application/x-bzip"],
    ["bz2", "application/x-bzip2"],
    ["cda", "application/x-cdf"],
    ["csh", "application/x-csh"],
    ["css", "text/css"],
    ["csv", "text/csv"],
    ["doc", "application/msword"],
    ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ["eot", "application/vnd.ms-fontobject"],
    ["epub", "application/epub+zip"],
    ["gz", "application/gzip"],
    ["gif", "image/gif"],
    ["heic", "image/heic"],
    ["heif", "image/heif"],
    ["htm", "text/html"],
    ["html", "text/html"],
    ["ico", "image/vnd.microsoft.icon"],
    ["ics", "text/calendar"],
    ["jar", "application/java-archive"],
    ["jpeg", "image/jpeg"],
    ["jpg", "image/jpeg"],
    ["js", "text/javascript"],
    ["json", "application/json"],
    ["jsonld", "application/ld+json"],
    ["mid", "audio/midi"],
    ["midi", "audio/midi"],
    ["mjs", "text/javascript"],
    ["mp3", "audio/mpeg"],
    ["mp4", "video/mp4"],
    ["mpeg", "video/mpeg"],
    ["mpkg", "application/vnd.apple.installer+xml"],
    ["odp", "application/vnd.oasis.opendocument.presentation"],
    ["ods", "application/vnd.oasis.opendocument.spreadsheet"],
    ["odt", "application/vnd.oasis.opendocument.text"],
    ["oga", "audio/ogg"],
    ["ogv", "video/ogg"],
    ["ogx", "application/ogg"],
    ["opus", "audio/opus"],
    ["otf", "font/otf"],
    ["png", "image/png"],
    ["pdf", "application/pdf"],
    ["php", "application/x-httpd-php"],
    ["ppt", "application/vnd.ms-powerpoint"],
    ["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    ["rar", "application/vnd.rar"],
    ["rtf", "application/rtf"],
    ["sh", "application/x-sh"],
    ["svg", "image/svg+xml"],
    ["swf", "application/x-shockwave-flash"],
    ["tar", "application/x-tar"],
    ["tif", "image/tiff"],
    ["tiff", "image/tiff"],
    ["ts", "video/mp2t"],
    ["ttf", "font/ttf"],
    ["txt", "text/plain"],
    ["vsd", "application/vnd.visio"],
    ["wav", "audio/wav"],
    ["weba", "audio/webm"],
    ["webm", "video/webm"],
    ["webp", "image/webp"],
    ["woff", "font/woff"],
    ["woff2", "font/woff2"],
    ["xhtml", "application/xhtml+xml"],
    ["xls", "application/vnd.ms-excel"],
    ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    ["xml", "application/xml"],
    ["xul", "application/vnd.mozilla.xul+xml"],
    ["zip", "application/zip"],
    ["7z", "application/x-7z-compressed"],
    ["mkv", "video/x-matroska"],
    ["mov", "video/quicktime"],
    ["msg", "application/vnd.ms-outlook"]
]);

function tn(e, t) {
    var n = sm(e);
    if (typeof n.path != "string") {
        var r = e.webkitRelativePath;
        Object.defineProperty(n, "path", {
            value: typeof t == "string" ? t : typeof r == "string" && r.length > 0 ? r : e.name,
            writable: !1,
            configurable: !1,
            enumerable: !0
        })
    }
    return n
}

function sm(e) {
    var t = e.name,
        n = t && t.lastIndexOf(".") !== -1;
    if (n && !e.type) {
        var r = t.split(".").pop().toLowerCase(),
            o = im.get(r);
        o && Object.defineProperty(e, "type", {
            value: o,
            writable: !1,
            configurable: !1,
            enumerable: !0
        })
    }
    return e
}
var am = [".DS_Store", "Thumbs.db"];

function cm(e) {
    return wt(this, void 0, void 0, function() {
        return Et(this, function(t) {
            return jn(e) && lm(e) ? [2, hm(e.dataTransfer, e.type)] : um(e) ? [2, fm(e)] : Array.isArray(e) && e.every(function(n) {
                return "getFile" in n && typeof n.getFile == "function"
            }) ? [2, dm(e)] : [2, []]
        })
    })
}

function lm(e) {
    return jn(e.dataTransfer)
}

function um(e) {
    return jn(e) && jn(e.target)
}

function jn(e) {
    return typeof e == "object" && e !== null
}

function fm(e) {
    return mo(e.target.files).map(function(t) {
        return tn(t)
    })
}

function dm(e) {
    return wt(this, void 0, void 0, function() {
        var t;
        return Et(this, function(n) {
            switch (n.label) {
                case 0:
                    return [4, Promise.all(e.map(function(r) {
                        return r.getFile()
                    }))];
                case 1:
                    return t = n.sent(), [2, t.map(function(r) {
                        return tn(r)
                    })]
            }
        })
    })
}

function hm(e, t) {
    return wt(this, void 0, void 0, function() {
        var n, r;
        return Et(this, function(o) {
            switch (o.label) {
                case 0:
                    return e === null ? [2, []] : e.items ? (n = mo(e.items).filter(function(i) {
                        return i.kind === "file"
                    }), t !== "drop" ? [2, n] : [4, Promise.all(n.map(pm))]) : [3, 2];
                case 1:
                    return r = o.sent(), [2, es(Vc(r))];
                case 2:
                    return [2, es(mo(e.files).map(function(i) {
                        return tn(i)
                    }))]
            }
        })
    })
}

function es(e) {
    return e.filter(function(t) {
        return am.indexOf(t.name) === -1
    })
}

function mo(e) {
    if (e === null) return [];
    for (var t = [], n = 0; n < e.length; n++) {
        var r = e[n];
        t.push(r)
    }
    return t
}

function pm(e) {
    if (typeof e.webkitGetAsEntry != "function") return ts(e);
    var t = e.webkitGetAsEntry();
    return t && t.isDirectory ? Uc(t) : ts(e)
}

function Vc(e) {
    return e.reduce(function(t, n) {
        return Rl(t, Array.isArray(n) ? Vc(n) : [n])
    }, [])
}

function ts(e) {
    var t = e.getAsFile();
    if (!t) return Promise.reject(e + " is not a File");
    var n = tn(t);
    return Promise.resolve(n)
}

function gm(e) {
    return wt(this, void 0, void 0, function() {
        return Et(this, function(t) {
            return [2, e.isDirectory ? Uc(e) : mm(e)]
        })
    })
}

function Uc(e) {
    var t = e.createReader();
    return new Promise(function(n, r) {
        var o = [];

        function i() {
            var s = this;
            t.readEntries(function(a) {
                return wt(s, void 0, void 0, function() {
                    var c, l, u;
                    return Et(this, function(f) {
                        switch (f.label) {
                            case 0:
                                if (a.length) return [3, 5];
                                f.label = 1;
                            case 1:
                                return f.trys.push([1, 3, , 4]), [4, Promise.all(o)];
                            case 2:
                                return c = f.sent(), n(c), [3, 4];
                            case 3:
                                return l = f.sent(), r(l), [3, 4];
                            case 4:
                                return [3, 6];
                            case 5:
                                u = Promise.all(a.map(gm)), o.push(u), i(), f.label = 6;
                            case 6:
                                return [2]
                        }
                    })
                })
            }, function(a) {
                r(a)
            })
        }
        i()
    })
}

function mm(e) {
    return wt(this, void 0, void 0, function() {
        return Et(this, function(t) {
            return [2, new Promise(function(n, r) {
                e.file(function(o) {
                    var i = tn(o, e.fullPath);
                    n(i)
                }, function(o) {
                    r(o)
                })
            })]
        })
    })
}
var yn = {},
    ns;

function vm() {
    return ns || (ns = 1, yn.__esModule = !0, yn.default = function(e, t) {
        if (e && t) {
            var n = Array.isArray(t) ? t : t.split(",");
            if (n.length === 0) return !0;
            var r = e.name || "",
                o = (e.type || "").toLowerCase(),
                i = o.replace(/\/.*$/, "");
            return n.some(function(s) {
                var a = s.trim().toLowerCase();
                return a.charAt(0) === "." ? r.toLowerCase().endsWith(a) : a.endsWith("/*") ? i === a.replace(/\/.*$/, "") : o === a
            })
        }
        return !0
    }), yn
}
var bm = vm();
const ym = qt(bm);

function rs(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var r = Object.getOwnPropertySymbols(e);
        t && (r = r.filter(function(o) {
            return Object.getOwnPropertyDescriptor(e, o).enumerable
        })), n.push.apply(n, r)
    }
    return n
}

function os(e) {
    for (var t = 1; t < arguments.length; t++) {
        var n = arguments[t] != null ? arguments[t] : {};
        t % 2 ? rs(Object(n), !0).forEach(function(r) {
            qc(e, r, n[r])
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : rs(Object(n)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r))
        })
    }
    return e
}

function qc(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function is(e, t) {
    return Em(e) || wm(e, t) || xm(e, t) || _m()
}

function _m() {
    throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)
}

function xm(e, t) {
    if (e) {
        if (typeof e == "string") return ss(e, t);
        var n = Object.prototype.toString.call(e).slice(8, -1);
        if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return ss(e, t)
    }
}

function ss(e, t) {
    (t == null || t > e.length) && (t = e.length);
    for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
    return r
}

function wm(e, t) {
    var n = e == null ? null : typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
    if (n != null) {
        var r = [],
            o = !0,
            i = !1,
            s, a;
        try {
            for (n = n.call(e); !(o = (s = n.next()).done) && (r.push(s.value), !(t && r.length === t)); o = !0);
        } catch (c) {
            i = !0, a = c
        } finally {
            try {
                !o && n.return != null && n.return()
            } finally {
                if (i) throw a
            }
        }
        return r
    }
}

function Em(e) {
    if (Array.isArray(e)) return e
}
var $m = "file-invalid-type",
    Sm = "file-too-large",
    Cm = "file-too-small",
    Tm = "too-many-files",
    Rm = function(t) {
        t = Array.isArray(t) && t.length === 1 ? t[0] : t;
        var n = Array.isArray(t) ? "one of ".concat(t.join(", ")) : t;
        return {
            code: $m,
            message: "File type must be ".concat(n)
        }
    },
    as = function(t) {
        return {
            code: Sm,
            message: "File is larger than ".concat(t, " ").concat(t === 1 ? "byte" : "bytes")
        }
    },
    cs = function(t) {
        return {
            code: Cm,
            message: "File is smaller than ".concat(t, " ").concat(t === 1 ? "byte" : "bytes")
        }
    },
    Om = {
        code: Tm,
        message: "Too many files"
    };

function Kc(e, t) {
    var n = e.type === "application/x-moz-file" || ym(e, t);
    return [n, n ? null : Rm(t)]
}

function Gc(e, t, n) {
    if (It(e.size))
        if (It(t) && It(n)) {
            if (e.size > n) return [!1, as(n)];
            if (e.size < t) return [!1, cs(t)]
        } else {
            if (It(t) && e.size < t) return [!1, cs(t)];
            if (It(n) && e.size > n) return [!1, as(n)]
        }
    return [!0, null]
}

function It(e) {
    return e != null
}

function km(e) {
    var t = e.files,
        n = e.accept,
        r = e.minSize,
        o = e.maxSize,
        i = e.multiple,
        s = e.maxFiles;
    return !i && t.length > 1 || i && s >= 1 && t.length > s ? !1 : t.every(function(a) {
        var c = Kc(a, n),
            l = is(c, 1),
            u = l[0],
            f = Gc(a, r, o),
            d = is(f, 1),
            h = d[0];
        return u && h
    })
}

function Ln(e) {
    return typeof e.isPropagationStopped == "function" ? e.isPropagationStopped() : typeof e.cancelBubble < "u" ? e.cancelBubble : !1
}

function _n(e) {
    return e.dataTransfer ? Array.prototype.some.call(e.dataTransfer.types, function(t) {
        return t === "Files" || t === "application/x-moz-file"
    }) : !!e.target && !!e.target.files
}

function ls(e) {
    e.preventDefault()
}

function Im(e) {
    return e.indexOf("MSIE") !== -1 || e.indexOf("Trident/") !== -1
}

function Pm(e) {
    return e.indexOf("Edge/") !== -1
}

function Am() {
    var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : window.navigator.userAgent;
    return Im(e) || Pm(e)
}

function Ce() {
    for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++) t[n] = arguments[n];
    return function(r) {
        for (var o = arguments.length, i = new Array(o > 1 ? o - 1 : 0), s = 1; s < o; s++) i[s - 1] = arguments[s];
        return t.some(function(a) {
            return !Ln(r) && a && a.apply(void 0, [r].concat(i)), Ln(r)
        })
    }
}

function Dm() {
    return "showOpenFilePicker" in window
}

function Mm(e) {
    return e = typeof e == "string" ? e.split(",") : e, [{
        description: "everything",
        accept: Array.isArray(e) ? e.filter(function(t) {
            return t === "audio/*" || t === "video/*" || t === "image/*" || t === "text/*" || /\w+\/[-+.\w]+/g.test(t)
        }).reduce(function(t, n) {
            return os(os({}, t), {}, qc({}, n, []))
        }, {}) : {}
    }]
}

function jm(e) {
    return e instanceof DOMException && (e.name === "AbortError" || e.code === e.ABORT_ERR)
}

function Lm(e) {
    return e instanceof DOMException && (e.name === "SecurityError" || e.code === e.SECURITY_ERR)
}
var Nm = ["children"],
    Fm = ["open"],
    zm = ["refKey", "role", "onKeyDown", "onFocus", "onBlur", "onClick", "onDragEnter", "onDragOver", "onDragLeave", "onDrop"],
    Wm = ["refKey", "onChange", "onClick"];

function Bm(e) {
    return Um(e) || Vm(e) || Yc(e) || Hm()
}

function Hm() {
    throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)
}

function Vm(e) {
    if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e)
}

function Um(e) {
    if (Array.isArray(e)) return vo(e)
}

function Cr(e, t) {
    return Gm(e) || Km(e, t) || Yc(e, t) || qm()
}

function qm() {
    throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)
}

function Yc(e, t) {
    if (e) {
        if (typeof e == "string") return vo(e, t);
        var n = Object.prototype.toString.call(e).slice(8, -1);
        if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return vo(e, t)
    }
}

function vo(e, t) {
    (t == null || t > e.length) && (t = e.length);
    for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
    return r
}

function Km(e, t) {
    var n = e == null ? null : typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
    if (n != null) {
        var r = [],
            o = !0,
            i = !1,
            s, a;
        try {
            for (n = n.call(e); !(o = (s = n.next()).done) && (r.push(s.value), !(t && r.length === t)); o = !0);
        } catch (c) {
            i = !0, a = c
        } finally {
            try {
                !o && n.return != null && n.return()
            } finally {
                if (i) throw a
            }
        }
        return r
    }
}

function Gm(e) {
    if (Array.isArray(e)) return e
}

function us(e, t) {
    var n = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
        var r = Object.getOwnPropertySymbols(e);
        t && (r = r.filter(function(o) {
            return Object.getOwnPropertyDescriptor(e, o).enumerable
        })), n.push.apply(n, r)
    }
    return n
}

function Q(e) {
    for (var t = 1; t < arguments.length; t++) {
        var n = arguments[t] != null ? arguments[t] : {};
        t % 2 ? us(Object(n), !0).forEach(function(r) {
            bo(e, r, n[r])
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : us(Object(n)).forEach(function(r) {
            Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r))
        })
    }
    return e
}

function bo(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n, e
}

function Nn(e, t) {
    if (e == null) return {};
    var n = Ym(e, t),
        r, o;
    if (Object.getOwnPropertySymbols) {
        var i = Object.getOwnPropertySymbols(e);
        for (o = 0; o < i.length; o++) r = i[o], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r])
    }
    return n
}

function Ym(e, t) {
    if (e == null) return {};
    var n = {},
        r = Object.keys(e),
        o, i;
    for (i = 0; i < r.length; i++) o = r[i], !(t.indexOf(o) >= 0) && (n[o] = e[o]);
    return n
}
var qo = g.forwardRef(function(e, t) {
    var n = e.children,
        r = Nn(e, Nm),
        o = Xc(r),
        i = o.open,
        s = Nn(o, Fm);
    return g.useImperativeHandle(t, function() {
        return {
            open: i
        }
    }, [i]), y.createElement(g.Fragment, null, n(Q(Q({}, s), {}, {
        open: i
    })))
});
qo.displayName = "Dropzone";
var Qc = {
    disabled: !1,
    getFilesFromEvent: cm,
    maxSize: 1 / 0,
    minSize: 0,
    multiple: !0,
    maxFiles: 0,
    preventDropOnDocument: !0,
    noClick: !1,
    noKeyboard: !1,
    noDrag: !1,
    noDragEventsBubbling: !1,
    validator: null,
    useFsAccessApi: !0
};
qo.defaultProps = Qc;
qo.propTypes = {
    children: G.func,
    accept: G.oneOfType([G.string, G.arrayOf(G.string)]),
    multiple: G.bool,
    preventDropOnDocument: G.bool,
    noClick: G.bool,
    noKeyboard: G.bool,
    noDrag: G.bool,
    noDragEventsBubbling: G.bool,
    minSize: G.number,
    maxSize: G.number,
    maxFiles: G.number,
    disabled: G.bool,
    getFilesFromEvent: G.func,
    onFileDialogCancel: G.func,
    onFileDialogOpen: G.func,
    useFsAccessApi: G.bool,
    onDragEnter: G.func,
    onDragLeave: G.func,
    onDragOver: G.func,
    onDrop: G.func,
    onDropAccepted: G.func,
    onDropRejected: G.func,
    validator: G.func
};
var yo = {
    isFocused: !1,
    isFileDialogActive: !1,
    isDragActive: !1,
    isDragAccept: !1,
    isDragReject: !1,
    draggedFiles: [],
    acceptedFiles: [],
    fileRejections: []
};

function Xc() {
    var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
        t = Q(Q({}, Qc), e),
        n = t.accept,
        r = t.disabled,
        o = t.getFilesFromEvent,
        i = t.maxSize,
        s = t.minSize,
        a = t.multiple,
        c = t.maxFiles,
        l = t.onDragEnter,
        u = t.onDragLeave,
        f = t.onDragOver,
        d = t.onDrop,
        h = t.onDropAccepted,
        p = t.onDropRejected,
        m = t.onFileDialogCancel,
        v = t.onFileDialogOpen,
        b = t.useFsAccessApi,
        _ = t.preventDropOnDocument,
        x = t.noClick,
        w = t.noKeyboard,
        C = t.noDrag,
        E = t.noDragEventsBubbling,
        S = t.validator,
        R = g.useMemo(function() {
            return typeof v == "function" ? v : fs
        }, [v]),
        j = g.useMemo(function() {
            return typeof m == "function" ? m : fs
        }, [m]),
        T = g.useRef(null),
        O = g.useRef(null),
        k = g.useReducer(Qm, yo),
        A = Cr(k, 2),
        M = A[0],
        N = A[1],
        W = M.isFocused,
        V = M.isFileDialogActive,
        I = M.draggedFiles,
        U = g.useRef(typeof window < "u" && window.isSecureContext && b && Dm()),
        te = function() {
            !U.current && V && setTimeout(function() {
                if (O.current) {
                    var B = O.current.files;
                    B.length || (N({
                        type: "closeDialog"
                    }), j())
                }
            }, 300)
        };
    g.useEffect(function() {
        return window.addEventListener("focus", te, !1),
            function() {
                window.removeEventListener("focus", te, !1)
            }
    }, [O, V, j, U]);
    var me = g.useRef([]),
        nn = function(B) {
            T.current && T.current.contains(B.target) || (B.preventDefault(), me.current = [])
        };
    g.useEffect(function() {
        return _ && (document.addEventListener("dragover", ls, !1), document.addEventListener("drop", nn, !1)),
            function() {
                _ && (document.removeEventListener("dragover", ls), document.removeEventListener("drop", nn))
            }
    }, [T, _]);
    var rn = g.useCallback(function(P) {
            P.preventDefault(), P.persist(), dn(P), me.current = [].concat(Bm(me.current), [P.target]), _n(P) && Promise.resolve(o(P)).then(function(B) {
                Ln(P) && !E || (N({
                    draggedFiles: B,
                    isDragActive: !0,
                    type: "setDraggedFiles"
                }), l && l(P))
            })
        }, [o, l, E]),
        on = g.useCallback(function(P) {
            P.preventDefault(), P.persist(), dn(P);
            var B = _n(P);
            if (B && P.dataTransfer) try {
                P.dataTransfer.dropEffect = "copy"
            } catch {}
            return B && f && f(P), !1
        }, [f, E]),
        sn = g.useCallback(function(P) {
            P.preventDefault(), P.persist(), dn(P);
            var B = me.current.filter(function(ue) {
                    return T.current && T.current.contains(ue)
                }),
                re = B.indexOf(P.target);
            re !== -1 && B.splice(re, 1), me.current = B, !(B.length > 0) && (N({
                isDragActive: !1,
                type: "setDraggedFiles",
                draggedFiles: []
            }), _n(P) && u && u(P))
        }, [T, u, E]),
        st = g.useCallback(function(P, B) {
            var re = [],
                ue = [];
            P.forEach(function(xe) {
                var Rt = Kc(xe, n),
                    at = Cr(Rt, 2),
                    ir = at[0],
                    sr = at[1],
                    ar = Gc(xe, s, i),
                    hn = Cr(ar, 2),
                    cr = hn[0],
                    lr = hn[1],
                    ur = S ? S(xe) : null;
                if (ir && cr && !ur) re.push(xe);
                else {
                    var fr = [sr, lr];
                    ur && (fr = fr.concat(ur)), ue.push({
                        file: xe,
                        errors: fr.filter(function(Sl) {
                            return Sl
                        })
                    })
                }
            }), (!a && re.length > 1 || a && c >= 1 && re.length > c) && (re.forEach(function(xe) {
                ue.push({
                    file: xe,
                    errors: [Om]
                })
            }), re.splice(0)), N({
                acceptedFiles: re,
                fileRejections: ue,
                type: "setFiles"
            }), d && d(re, ue, B), ue.length > 0 && p && p(ue, B), re.length > 0 && h && h(re, B)
        }, [N, a, n, s, i, c, d, h, p, S]),
        Se = g.useCallback(function(P) {
            P.preventDefault(), P.persist(), dn(P), me.current = [], _n(P) && Promise.resolve(o(P)).then(function(B) {
                Ln(P) && !E || st(B, P)
            }), N({
                type: "reset"
            })
        }, [o, st, E]),
        De = g.useCallback(function() {
            if (U.current) {
                N({
                    type: "openDialog"
                }), R();
                var P = {
                    multiple: a,
                    types: Mm(n)
                };
                window.showOpenFilePicker(P).then(function(B) {
                    return o(B)
                }).then(function(B) {
                    st(B, null), N({
                        type: "closeDialog"
                    })
                }).catch(function(B) {
                    jm(B) ? (j(B), N({
                        type: "closeDialog"
                    })) : Lm(B) && (U.current = !1, O.current && (O.current.value = null, O.current.click()))
                });
                return
            }
            O.current && (N({
                type: "openDialog"
            }), R(), O.current.value = null, O.current.click())
        }, [N, R, j, b, st, n, a]),
        an = g.useCallback(function(P) {
            !T.current || !T.current.isEqualNode(P.target) || (P.key === " " || P.key === "Enter" || P.keyCode === 32 || P.keyCode === 13) && (P.preventDefault(), De())
        }, [T, De]),
        cn = g.useCallback(function() {
            N({
                type: "focus"
            })
        }, []),
        ln = g.useCallback(function() {
            N({
                type: "blur"
            })
        }, []),
        un = g.useCallback(function() {
            x || (Am() ? setTimeout(De, 0) : De())
        }, [x, De]),
        _e = function(B) {
            return r ? null : B
        },
        or = function(B) {
            return w ? null : _e(B)
        },
        fn = function(B) {
            return C ? null : _e(B)
        },
        dn = function(B) {
            E && B.stopPropagation()
        },
        xl = g.useMemo(function() {
            return function() {
                var P = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
                    B = P.refKey,
                    re = B === void 0 ? "ref" : B,
                    ue = P.role,
                    xe = P.onKeyDown,
                    Rt = P.onFocus,
                    at = P.onBlur,
                    ir = P.onClick,
                    sr = P.onDragEnter,
                    ar = P.onDragOver,
                    hn = P.onDragLeave,
                    cr = P.onDrop,
                    lr = Nn(P, zm);
                return Q(Q(bo({
                    onKeyDown: or(Ce(xe, an)),
                    onFocus: or(Ce(Rt, cn)),
                    onBlur: or(Ce(at, ln)),
                    onClick: _e(Ce(ir, un)),
                    onDragEnter: fn(Ce(sr, rn)),
                    onDragOver: fn(Ce(ar, on)),
                    onDragLeave: fn(Ce(hn, sn)),
                    onDrop: fn(Ce(cr, Se)),
                    role: typeof ue == "string" && ue !== "" ? ue : "button"
                }, re, T), !r && !w ? {
                    tabIndex: 0
                } : {}), lr)
            }
        }, [T, an, cn, ln, un, rn, on, sn, Se, w, C, r]),
        wl = g.useCallback(function(P) {
            P.stopPropagation()
        }, []),
        El = g.useMemo(function() {
            return function() {
                var P = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
                    B = P.refKey,
                    re = B === void 0 ? "ref" : B,
                    ue = P.onChange,
                    xe = P.onClick,
                    Rt = Nn(P, Wm),
                    at = bo({
                        accept: n,
                        multiple: a,
                        type: "file",
                        style: {
                            display: "none"
                        },
                        onChange: _e(Ce(ue, Se)),
                        onClick: _e(Ce(xe, wl)),
                        tabIndex: -1
                    }, re, O);
                return Q(Q({}, at), Rt)
            }
        }, [O, n, a, Se, r]),
        Yo = I.length,
        Qo = Yo > 0 && km({
            files: I,
            accept: n,
            minSize: s,
            maxSize: i,
            multiple: a,
            maxFiles: c
        }),
        $l = Yo > 0 && !Qo;
    return Q(Q({}, M), {}, {
        isDragAccept: Qo,
        isDragReject: $l,
        isFocused: W && !r,
        getRootProps: xl,
        getInputProps: El,
        rootRef: T,
        inputRef: O,
        open: _e(De)
    })
}

function Qm(e, t) {
    switch (t.type) {
        case "focus":
            return Q(Q({}, e), {}, {
                isFocused: !0
            });
        case "blur":
            return Q(Q({}, e), {}, {
                isFocused: !1
            });
        case "openDialog":
            return Q(Q({}, yo), {}, {
                isFileDialogActive: !0
            });
        case "closeDialog":
            return Q(Q({}, e), {}, {
                isFileDialogActive: !1
            });
        case "setDraggedFiles":
            var n = t.isDragActive,
                r = t.draggedFiles;
            return Q(Q({}, e), {}, {
                draggedFiles: r,
                isDragActive: n
            });
        case "setFiles":
            return Q(Q({}, e), {}, {
                acceptedFiles: t.acceptedFiles,
                fileRejections: t.fileRejections
            });
        case "reset":
            return Q({}, yo);
        default:
            return e
    }
}

function fs() {}

function Xm(e) {
    let t;
    const n = new Set,
        r = (l, u) => {
            const f = typeof l == "function" ? l(t) : l;
            if (f !== t) {
                const d = t;
                t = u ? f : Object.assign({}, t, f), n.forEach(h => h(t, d))
            }
        },
        o = () => t,
        i = (l, u = o, f = Object.is) => {
            console.warn("[DEPRECATED] Please use `subscribeWithSelector` middleware");
            let d = u(t);

            function h() {
                const p = u(t);
                if (!f(d, p)) {
                    const m = d;
                    l(d = p, m)
                }
            }
            return n.add(h), () => n.delete(h)
        },
        c = {
            setState: r,
            getState: o,
            subscribe: (l, u, f) => u || f ? i(l, u, f) : (n.add(l), () => n.delete(l)),
            destroy: () => n.clear()
        };
    return t = e(r, o, c), c
}
const Jm = typeof window > "u" || !window.navigator || /ServerSideRendering|^Deno\//.test(window.navigator.userAgent),
    ds = Jm ? g.useEffect : g.useLayoutEffect;

function Zm(e) {
    const t = typeof e == "function" ? Xm(e) : e,
        n = (r = t.getState, o = Object.is) => {
            const [, i] = g.useReducer(v => v + 1, 0), s = t.getState(), a = g.useRef(s), c = g.useRef(r), l = g.useRef(o), u = g.useRef(!1), f = g.useRef();
            f.current === void 0 && (f.current = r(s));
            let d, h = !1;
            (a.current !== s || c.current !== r || l.current !== o || u.current) && (d = r(s), h = !o(f.current, d)), ds(() => {
                h && (f.current = d), a.current = s, c.current = r, l.current = o, u.current = !1
            });
            const p = g.useRef(s);
            ds(() => {
                const v = () => {
                        try {
                            const _ = t.getState(),
                                x = c.current(_);
                            l.current(f.current, x) || (a.current = _, f.current = x, i())
                        } catch {
                            u.current = !0, i()
                        }
                    },
                    b = t.subscribe(v);
                return t.getState() !== p.current && v(), b
            }, []);
            const m = h ? d : f.current;
            return g.useDebugValue(m), m
        };
    return Object.assign(n, t), n[Symbol.iterator] = function() {
        console.warn("[useStore, api] = create() is deprecated and will be removed in v4");
        const r = [n, t];
        return {
            next() {
                const o = r.length <= 0;
                return {
                    value: r.shift(),
                    done: o
                }
            }
        }
    }, n
}
const ev = e => (t, n, r) => {
    const o = r.subscribe;
    return r.subscribe = (s, a, c) => {
        let l = s;
        if (a) {
            const u = c ?.equalityFn || Object.is;
            let f = s(r.getState());
            l = d => {
                const h = s(d);
                if (!u(f, h)) {
                    const p = f;
                    a(f = h, p)
                }
            }, c ?.fireImmediately && a(f, f)
        }
        return o(l)
    }, e(t, n, r)
};
var Tr, hs;

function tv() {
    return hs || (hs = 1, Tr = function(t) {
        return t != null && typeof t == "object" && Array.isArray(t) === !1
    }), Tr
}
var Rr, ps;

function Jc() {
    if (ps) return Rr;
    ps = 1;
    var e = tv();

    function t(n) {
        return e(n) === !0 && Object.prototype.toString.call(n) === "[object Object]"
    }
    return Rr = function(r) {
        var o, i;
        return !(t(r) === !1 || (o = r.constructor, typeof o != "function") || (i = o.prototype, t(i) === !1) || i.hasOwnProperty("isPrototypeOf") === !1)
    }, Rr
}
var Or, gs;

function Ko() {
    if (gs) return Or;
    gs = 1;
    var e = Jc();
    return Or = function(n) {
        return e(n) || typeof n == "function" || Array.isArray(n)
    }, Or
}
var kr, ms;

function nv() {
    return ms || (ms = 1, kr = function(t, n, r) {
        for (var o in t)
            if (n.call(r, t[o], o, t) === !1) break
    }), kr
}
var Ir, vs;

function rv() {
    if (vs) return Ir;
    vs = 1;
    var e = Ko(),
        t = nv();

    function n(s, a) {
        for (var c = arguments.length, l = 0; ++l < c;) {
            var u = arguments[l];
            o(u) && t(u, r, s)
        }
        return s
    }

    function r(s, a) {
        if (i(a)) {
            var c = this[a];
            o(s) && o(c) ? n(c, s) : this[a] = s
        }
    }

    function o(s) {
        return e(s) && !Array.isArray(s)
    }

    function i(s) {
        return s !== "__proto__" && s !== "constructor" && s !== "prototype"
    }
    return Ir = n, Ir
}
var Pr, bs;

function ov() {
    if (bs) return Pr;
    bs = 1, Pr = function(n, r, o, i, s) {
        if (!e(n) || !r) return n;
        if (r = t(r), o && (r += "." + t(o)), i && (r += "." + t(i)), s && (r += "." + t(s)), r in n) return n[r];
        for (var a = r.split("."), c = a.length, l = -1; n && ++l < c;) {
            for (var u = a[l]; u[u.length - 1] === "\\";) u = u.slice(0, -1) + "." + a[++l];
            n = n[u]
        }
        return n
    };

    function e(n) {
        return n !== null && (typeof n == "object" || typeof n == "function")
    }

    function t(n) {
        return n ? Array.isArray(n) ? n.join(".") : n : ""
    }
    return Pr
}
var Ar, ys;

function iv() {
    return ys || (ys = 1, Ar = function(e, t) {
        if (e === null || typeof e > "u") throw new TypeError("expected first argument to be an object.");
        if (typeof t > "u" || typeof Symbol > "u" || typeof Object.getOwnPropertySymbols != "function") return e;
        for (var n = Object.prototype.propertyIsEnumerable, r = Object(e), o = arguments.length, i = 0; ++i < o;)
            for (var s = Object(arguments[i]), a = Object.getOwnPropertySymbols(s), c = 0; c < a.length; c++) {
                var l = a[c];
                n.call(s, l) && (r[l] = s[l])
            }
        return r
    }), Ar
}
var Dr, _s;

function sv() {
    if (_s) return Dr;
    _s = 1;
    var e = Ko(),
        t = iv();
    Dr = Object.assign || function(a) {
        if (a === null || typeof a > "u") throw new TypeError("Cannot convert undefined or null to object");
        i(a) || (a = {});
        for (var c = 1; c < arguments.length; c++) {
            var l = arguments[c];
            r(l) && (l = o(l)), i(l) && (n(a, l), t(a, l))
        }
        return a
    };

    function n(a, c) {
        for (var l in c) s(c, l) && (a[l] = c[l])
    }

    function r(a) {
        return a && typeof a == "string"
    }

    function o(a) {
        var c = {};
        for (var l in a) c[l] = a[l];
        return c
    }

    function i(a) {
        return a && typeof a == "object" || e(a)
    }

    function s(a, c) {
        return Object.prototype.hasOwnProperty.call(a, c)
    }
    return Dr
}
var Mr, xs;

function av() {
    if (xs) return Mr;
    xs = 1;
    var e = sv();
    Mr = function(o, i, s) {
        if (typeof o != "string") throw new TypeError("expected a string");
        typeof i == "function" && (s = i, i = null), typeof i == "string" && (i = {
            sep: i
        });
        var a = e({
                sep: "."
            }, i),
            c = a.quotes || ['"', "'", "`"],
            l;
        a.brackets === !0 ? l = {
            "<": ">",
            "(": ")",
            "[": "]",
            "{": "}"
        } : a.brackets && (l = a.brackets);
        var u = [],
            f = [],
            d = [""],
            h = a.sep,
            p = o.length,
            m = -1,
            v;

        function b() {
            if (l && f.length) return l[f[f.length - 1]]
        }
        for (; ++m < p;) {
            var _ = o[m],
                x = o[m + 1],
                w = {
                    val: _,
                    idx: m,
                    arr: d,
                    str: o
                };
            if (u.push(w), _ === "\\") {
                w.val = r(a, o, m) === !0 ? _ + x : x, w.escaped = !0, typeof s == "function" && s(w), d[d.length - 1] += w.val, m++;
                continue
            }
            if (l && l[_]) {
                f.push(_);
                var C = b(),
                    E = m + 1;
                if (o.indexOf(C, E + 1) !== -1)
                    for (; f.length && E < p;) {
                        var S = o[++E];
                        if (S === "\\") {
                            S++;
                            continue
                        }
                        if (c.indexOf(S) !== -1) {
                            E = t(o, S, E + 1);
                            continue
                        }
                        if (C = b(), f.length && o.indexOf(C, E + 1) === -1) break;
                        if (l[S]) {
                            f.push(S);
                            continue
                        }
                        C === S && f.pop()
                    }
                if (v = E, v === -1) {
                    d[d.length - 1] += _;
                    continue
                }
                _ = o.slice(m, v + 1), w.val = _, w.idx = m = v
            }
            if (c.indexOf(_) !== -1) {
                if (v = t(o, _, m + 1), v === -1) {
                    d[d.length - 1] += _;
                    continue
                }
                n(_, a) === !0 ? _ = o.slice(m, v + 1) : _ = o.slice(m + 1, v), w.val = _, w.idx = m = v
            }
            if (typeof s == "function" && (s(w, u), _ = w.val, m = w.idx), w.val === h && w.split !== !1) {
                d.push("");
                continue
            }
            d[d.length - 1] += w.val
        }
        return d
    };

    function t(o, i, s, a) {
        var c = o.indexOf(i, s);
        return o.charAt(c - 1) === "\\" ? t(o, i, c + 1) : c
    }

    function n(o, i) {
        return i.keepDoubleQuotes === !0 && o === '"' || i.keepSingleQuotes === !0 && o === "'" ? !0 : i.keepQuotes
    }

    function r(o, i, s) {
        return typeof o.keepEscaping == "function" ? o.keepEscaping(i, s) : o.keepEscaping === !0 || i[s + 1] === "\\"
    }
    return Mr
}
var jr, ws;

function cv() {
    return ws || (ws = 1, jr = function(t) {
        return typeof t < "u" && t !== null && (typeof t == "object" || typeof t == "function")
    }), jr
}
var Lr, Es;

function lv() {
    if (Es) return Lr;
    Es = 1;
    var e = cv();
    Lr = function(o) {
        e(o) || (o = {});
        for (var i = arguments.length, s = 1; s < i; s++) {
            var a = arguments[s];
            e(a) && t(o, a)
        }
        return o
    };

    function t(r, o) {
        for (var i in o) n(o, i) && (r[i] = o[i])
    }

    function n(r, o) {
        return Object.prototype.hasOwnProperty.call(r, o)
    }
    return Lr
}
var Nr, $s;

function uv() {
    return $s || ($s = 1, Nr = function(t) {
        return typeof t < "u" && t !== null && (typeof t == "object" || typeof t == "function")
    }), Nr
}
var Fr, Ss;

function fv() {
    if (Ss) return Fr;
    Ss = 1;
    var e = av(),
        t = lv(),
        n = Jc(),
        r = uv();
    Fr = function(i, s, a) {
        if (!r(i) || (Array.isArray(s) && (s = [].concat.apply([], s).join(".")), typeof s != "string")) return i;
        for (var c = e(s, {
                sep: ".",
                brackets: !0
            }).filter(o), l = c.length, u = -1, f = i; ++u < l;) {
            var d = c[u];
            if (u !== l - 1) {
                r(f[d]) || (f[d] = {}), f = f[d];
                continue
            }
            n(f[d]) && n(a) ? f[d] = t({}, f[d], a) : f[d] = a
        }
        return i
    };

    function o(i) {
        return i !== "__proto__" && i !== "constructor" && i !== "prototype"
    }
    return Fr
}
var zr, Cs;

function dv() {
    if (Cs) return zr;
    Cs = 1;
    var e = Ko(),
        t = rv(),
        n = ov(),
        r = fv();
    return zr = function(i, s, a) {
        if (!e(i)) throw new TypeError("expected an object");
        if (typeof s != "string" || a == null) return t.apply(null, arguments);
        if (typeof a == "string") return r(i, s, a), i;
        var c = n(i, s);
        return e(a) && e(c) && (a = t({}, c, a)), r(i, s, a), i
    }, zr
}
var hv = dv();
const pv = qt(hv),
    Go = (...e) => e.filter(Boolean).join(".");

function gv(e) {
    const t = e.split(".");
    return [t.pop(), t.join(".") || void 0]
}

function mv(e, t) {
    return Object.entries(cp(e, t)).reduce((n, [, {
        value: r,
        disabled: o,
        key: i
    }]) => (n[i] = o ? void 0 : r, n), {})
}

function vv(e, t) {
    const n = g.useRef();
    return zt(e, n.current) || (n.current = e), n.current
}

function Zc(e, t) {
    var n;
    return g.useMemo(e, (n = vv(t)) !== null && n !== void 0 ? n : [])
}

function bv(e) {
    const t = g.useRef(null),
        n = g.useRef(null),
        r = g.useRef(!0);
    return g.useLayoutEffect(() => {
        e || (t.current.style.height = "0px", t.current.style.overflow = "hidden")
    }, []), g.useEffect(() => {
        if (r.current) {
            r.current = !1;
            return
        }
        let o;
        const i = t.current,
            s = () => {
                e && (i.style.removeProperty("height"), i.style.removeProperty("overflow"), n.current.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest"
                }))
            };
        i.addEventListener("transitionend", s, {
            once: !0
        });
        const {
            height: a
        } = n.current.getBoundingClientRect();
        return i.style.height = a + "px", e || (i.style.overflow = "hidden", o = window.setTimeout(() => i.style.height = "0px", 50)), () => {
            i.removeEventListener("transitionend", s), clearTimeout(o)
        }
    }, [e]), {
        wrapperRef: t,
        contentRef: n
    }
}
const yv = e => {
    const [t, n] = g.useState(e.getVisiblePaths());
    return g.useEffect(() => {
        n(e.getVisiblePaths());
        const r = e.useStore.subscribe(e.getVisiblePaths, n, {
            equalityFn: Hn
        });
        return () => r()
    }, [e]), t
};

function _v(e, t, n) {
    return e.useStore(o => {
        const i = F(F({}, n), o.data);
        return mv(i, t)
    }, Hn)
}

function el(e = 3) {
    const t = g.useRef(null),
        n = g.useRef(null),
        [r, o] = g.useState(!1),
        i = g.useCallback(() => o(!0), []),
        s = g.useCallback(() => o(!1), []);
    return g.useLayoutEffect(() => {
        if (r) {
            const {
                bottom: a,
                top: c,
                left: l
            } = t.current.getBoundingClientRect(), {
                height: u
            } = n.current.getBoundingClientRect(), f = a + u > window.innerHeight - 40 ? "up" : "down";
            n.current.style.position = "fixed", n.current.style.zIndex = "10000", n.current.style.left = l + "px", f === "down" ? n.current.style.top = a + e + "px" : n.current.style.bottom = window.innerHeight - c + e + "px"
        }
    }, [e, r]), {
        popinRef: t,
        wrapperRef: n,
        shown: r,
        show: i,
        hide: s
    }
}
Vg([Ug]);
const xv = {
    rgb: "toRgb",
    hsl: "toHsl",
    hsv: "toHsv",
    hex: "toHex"
};
fe.extend({
    color: () => e => ce(e).isValid()
});
const wv = e => fe().color().test(e);

function tl(e, {
    format: t,
    hasAlpha: n,
    isString: r
}) {
    const o = xv[t] + (r && t !== "hex" ? "String" : ""),
        i = e[o]();
    return typeof i == "object" && !n ? lp(i, ["a"]) : i
}
const nl = (e, t) => {
        const n = ce(e);
        if (!n.isValid()) throw Error("Invalid color");
        return tl(n, t)
    },
    Ev = (e, t) => tl(ce(e), F(F({}, t), {}, {
        isString: !0,
        format: "hex"
    })),
    $v = ({
        value: e
    }) => {
        const t = Hg(e),
            n = t === "name" ? "hex" : t,
            r = typeof e == "object" ? "a" in e : t === "hex" && e.length === 8 || /^(rgba)|(hsla)|(hsva)/.test(e),
            o = {
                format: n,
                hasAlpha: r,
                isString: typeof e == "string"
            };
        return {
            value: nl(e, o),
            settings: o
        }
    };
var Sv = Object.freeze({
    __proto__: null,
    schema: wv,
    sanitize: nl,
    format: Ev,
    normalize: $v
});
const Cv = L("div", {
        position: "relative",
        boxSizing: "border-box",
        borderRadius: "$sm",
        overflow: "hidden",
        cursor: "pointer",
        height: "$rowHeight",
        width: "$rowHeight",
        backgroundColor: "#fff",
        backgroundImage: `url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill-opacity=".05"><path d="M8 0h8v8H8zM0 8h8v8H0z"/></svg>')`,
        $inputStyle: "",
        $hover: "",
        zIndex: 1,
        variants: {
            active: {
                true: {
                    $inputStyle: "$accent1"
                }
            }
        },
        "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            backgroundColor: "currentColor",
            zIndex: 1
        }
    }),
    Tv = L("div", {
        position: "relative",
        display: "grid",
        gridTemplateColumns: "$sizes$rowHeight auto",
        columnGap: "$colGap",
        alignItems: "center"
    }),
    Rv = L("div", {
        width: "$colorPickerWidth",
        height: "$colorPickerHeight",
        ".react-colorful": {
            width: "100%",
            height: "100%",
            boxShadow: "$level2",
            cursor: "crosshair"
        },
        ".react-colorful__saturation": {
            borderRadius: "$sm $sm 0 0"
        },
        ".react-colorful__alpha, .react-colorful__hue": {
            height: 10
        },
        ".react-colorful__last-control": {
            borderRadius: "0 0 $sm $sm"
        },
        ".react-colorful__pointer": {
            height: 12,
            width: 12
        }
    });

function Ts(e, t) {
    return t !== "rgb" ? ce(e).toRgb() : e
}

function Ov({
    value: e,
    displayValue: t,
    settings: n,
    onUpdate: r
}) {
    const {
        emitOnEditStart: o,
        emitOnEditEnd: i
    } = ie(), {
        format: s,
        hasAlpha: a
    } = n, {
        popinRef: c,
        wrapperRef: l,
        shown: u,
        show: f,
        hide: d
    } = el(), h = g.useRef(0), [p, m] = g.useState(() => Ts(e, s)), v = a ? Jg : em, b = () => {
        m(Ts(e, s)), f(), o()
    }, _ = () => {
        d(), i(), window.clearTimeout(h.current)
    }, x = () => {
        h.current = window.setTimeout(_, 500)
    };
    return g.useEffect(() => () => window.clearTimeout(h.current), []), y.createElement(y.Fragment, null, y.createElement(Cv, {
        ref: c,
        active: u,
        onClick: () => b(),
        style: {
            color: t
        }
    }), u && y.createElement(Fo, null, y.createElement($c, {
        onPointerUp: _
    }), y.createElement(Rv, {
        ref: l,
        onMouseEnter: () => window.clearTimeout(h.current),
        onMouseLeave: w => w.buttons === 0 && x()
    }, y.createElement(v, {
        color: p,
        onChange: r
    }))))
}

function kv() {
    const {
        value: e,
        displayValue: t,
        label: n,
        onChange: r,
        onUpdate: o,
        settings: i
    } = ie();
    return y.createElement(ye, {
        input: !0
    }, y.createElement($e, null, n), y.createElement(Tv, null, y.createElement(Ov, {
        value: e,
        displayValue: t,
        onChange: r,
        onUpdate: o,
        settings: i
    }), y.createElement(No, {
        value: t,
        onChange: r,
        onUpdate: o
    })))
}
var Iv = F({
    component: kv
}, Sv);

function Pv() {
    const {
        label: e,
        displayValue: t,
        onUpdate: n,
        settings: r
    } = ie();
    return y.createElement(ye, {
        input: !0
    }, y.createElement($e, null, e), y.createElement(Wo, {
        value: t,
        settings: r,
        onUpdate: n
    }))
}
var Av = F({
    component: Pv
}, Pc(["x", "y", "z"]));
const Dv = L("div", {
        $flexCenter: "",
        position: "relative",
        backgroundColor: "$elevation3",
        borderRadius: "$sm",
        cursor: "pointer",
        height: "$rowHeight",
        width: "$rowHeight",
        touchAction: "none",
        $draggable: "",
        $hover: "",
        "&:active": {
            cursor: "none"
        },
        "&::after": {
            content: '""',
            backgroundColor: "$accent2",
            height: 4,
            width: 4,
            borderRadius: 2
        }
    }),
    Mv = L("div", {
        $flexCenter: "",
        width: "$joystickWidth",
        height: "$joystickHeight",
        borderRadius: "$sm",
        boxShadow: "$level2",
        position: "fixed",
        zIndex: 1e4,
        overflow: "hidden",
        $draggable: "",
        transform: "translate(-50%, -50%)",
        variants: {
            isOutOfBounds: {
                true: {
                    backgroundColor: "$elevation1"
                },
                false: {
                    backgroundColor: "$elevation3"
                }
            }
        },
        "> div": {
            position: "absolute",
            $flexCenter: "",
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: "$highlight1",
            backgroundColor: "$elevation3",
            width: "80%",
            height: "80%",
            "&::after,&::before": {
                content: '""',
                position: "absolute",
                zindex: 10,
                backgroundColor: "$highlight1"
            },
            "&::before": {
                width: "100%",
                height: 1
            },
            "&::after": {
                height: "100%",
                width: 1
            }
        },
        "> span": {
            position: "relative",
            zindex: 100,
            width: 10,
            height: 10,
            backgroundColor: "$accent2",
            borderRadius: "50%"
        }
    });

function jv({
    value: e,
    settings: t,
    onUpdate: n
}) {
    const r = g.useRef(),
        o = g.useRef(0),
        i = g.useRef(0),
        s = g.useRef(1),
        [a, c] = g.useState(!1),
        [l, u] = g.useState(!1),
        [f, d] = Cc(),
        h = g.useRef(null),
        p = g.useRef(null);
    g.useLayoutEffect(() => {
        if (a) {
            const {
                top: k,
                left: A,
                width: M,
                height: N
            } = h.current.getBoundingClientRect();
            p.current.style.left = A + M / 2 + "px", p.current.style.top = k + N / 2 + "px"
        }
    }, [a]);
    const {
        keys: [m, v],
        joystick: b
    } = t, _ = b === "invertY" ? 1 : -1, {
        [m]: {
            step: x
        },
        [v]: {
            step: w
        }
    } = t, C = Ne("sizes", "joystickWidth"), E = Ne("sizes", "joystickHeight"), S = parseFloat(C) * .8 / 2, R = parseFloat(E) * .8 / 2, j = g.useCallback(() => {
        r.current || (u(!0), o.current && d({
            x: o.current * S
        }), i.current && d({
            y: i.current * -R
        }), r.current = window.setInterval(() => {
            n(k => {
                const A = x * o.current * s.current,
                    M = _ * w * i.current * s.current;
                return Array.isArray(k) ? {
                    [m]: k[0] + A,
                    [v]: k[1] + M
                } : {
                    [m]: k[m] + A,
                    [v]: k[v] + M
                }
            })
        }, 16))
    }, [S, R, n, d, x, w, m, v, _]), T = g.useCallback(() => {
        window.clearTimeout(r.current), r.current = void 0, u(!1)
    }, []);
    g.useEffect(() => {
        function k(A) {
            s.current = uc(A)
        }
        return window.addEventListener("keydown", k), window.addEventListener("keyup", k), () => {
            window.clearTimeout(r.current), window.removeEventListener("keydown", k), window.removeEventListener("keyup", k)
        }
    }, []);
    const O = Zt(({
        first: k,
        active: A,
        delta: [M, N],
        movement: [W, V]
    }) => {
        k && c(!0);
        const I = Ye(W, -S, S),
            U = Ye(V, -R, R);
        o.current = Math.abs(W) > Math.abs(I) ? Math.sign(W - I) : 0, i.current = Math.abs(V) > Math.abs(U) ? Math.sign(U - V) : 0;
        let te = e[m],
            me = e[v];
        A ? (o.current || (te += M * x * s.current, d({
            x: I
        })), i.current || (me -= _ * N * w * s.current, d({
            y: U
        })), o.current || i.current ? j() : T(), n({
            [m]: te,
            [v]: me
        })) : (c(!1), o.current = 0, i.current = 0, d({
            x: 0,
            y: 0
        }), T())
    });
    return y.createElement(Dv, J({
        ref: h
    }, O()), a && y.createElement(Fo, null, y.createElement(Mv, {
        ref: p,
        isOutOfBounds: l
    }, y.createElement("div", null), y.createElement("span", {
        ref: f
    }))))
}
const Lv = L("div", {
    display: "grid",
    columnGap: "$colGap",
    variants: {
        withJoystick: {
            true: {
                gridTemplateColumns: "$sizes$rowHeight auto"
            },
            false: {
                gridTemplateColumns: "auto"
            }
        }
    }
});

function Nv() {
    const {
        label: e,
        displayValue: t,
        onUpdate: n,
        settings: r
    } = ie();
    return y.createElement(ye, {
        input: !0
    }, y.createElement($e, null, e), y.createElement(Lv, {
        withJoystick: !!r.joystick
    }, r.joystick && y.createElement(jv, {
        value: t,
        settings: r,
        onUpdate: n
    }), y.createElement(Wo, {
        value: t,
        settings: r,
        onUpdate: n
    })))
}
const Fv = ["joystick"],
    rl = Pc(["x", "y"]),
    zv = e => {
        let {
            joystick: t = !0
        } = e, n = K(e, Fv);
        const {
            value: r,
            settings: o
        } = rl.normalize(n);
        return {
            value: r,
            settings: F(F({}, o), {}, {
                joystick: t
            })
        }
    };
var Wv = F(F({
    component: Nv
}, rl), {}, {
    normalize: zv
});
const Bv = e => {
        if (e !== void 0) {
            if (e instanceof File) try {
                return URL.createObjectURL(e)
            } catch {
                return
            }
            if (typeof e == "string" && e.indexOf("blob:") === 0) return e;
            throw Error("Invalid image format [undefined | blob | File].")
        }
    },
    Hv = (e, t) => typeof t == "object" && "image" in t,
    Vv = ({
        image: e
    }) => ({
        value: e
    });
var Uv = Object.freeze({
    __proto__: null,
    sanitize: Bv,
    schema: Hv,
    normalize: Vv
});
const qv = L("div", {
        position: "relative",
        display: "grid",
        gridTemplateColumns: "$sizes$rowHeight auto 20px",
        columnGap: "$colGap",
        alignItems: "center"
    }),
    Kv = L("div", {
        $flexCenter: "",
        overflow: "hidden",
        height: "$rowHeight",
        background: "$elevation3",
        textAlign: "center",
        color: "inherit",
        borderRadius: "$sm",
        outline: "none",
        userSelect: "none",
        cursor: "pointer",
        $inputStyle: "",
        $hover: "",
        $focusWithin: "",
        $active: "$accent1 $elevation1",
        variants: {
            isDragAccept: {
                true: {
                    $inputStyle: "$accent1",
                    backgroundColor: "$elevation1"
                }
            }
        }
    }),
    Gv = L("div", {
        boxSizing: "border-box",
        borderRadius: "$sm",
        height: "$rowHeight",
        width: "$rowHeight",
        $inputStyle: "",
        backgroundSize: "cover",
        backgroundPosition: "center",
        variants: {
            hasImage: {
                true: {
                    cursor: "pointer",
                    $hover: "",
                    $active: ""
                }
            }
        }
    }),
    Yv = L("div", {
        $flexCenter: "",
        width: "$imagePreviewWidth",
        height: "$imagePreviewHeight",
        borderRadius: "$sm",
        boxShadow: "$level2",
        pointerEvents: "none",
        $inputStyle: "",
        backgroundSize: "cover",
        backgroundPosition: "center"
    }),
    Qv = L("div", {
        fontSize: "0.8em",
        height: "100%",
        padding: "$rowGap $md"
    }),
    Xv = L("div", {
        $flexCenter: "",
        top: "0",
        right: "0",
        marginRight: "$sm",
        height: "100%",
        cursor: "pointer",
        variants: {
            disabled: {
                true: {
                    color: "$elevation3",
                    cursor: "default"
                }
            }
        },
        "&::after,&::before": {
            content: '""',
            position: "absolute",
            height: 2,
            width: 10,
            borderRadius: 1,
            backgroundColor: "currentColor"
        },
        "&::after": {
            transform: "rotate(45deg)"
        },
        "&::before": {
            transform: "rotate(-45deg)"
        }
    });

function Jv() {
    const {
        label: e,
        value: t,
        onUpdate: n,
        disabled: r
    } = ie(), {
        popinRef: o,
        wrapperRef: i,
        shown: s,
        show: a,
        hide: c
    } = el(), l = g.useCallback(p => {
        p.length && n(p[0])
    }, [n]), u = g.useCallback(p => {
        p.stopPropagation(), n(void 0)
    }, [n]), {
        getRootProps: f,
        getInputProps: d,
        isDragAccept: h
    } = Xc({
        maxFiles: 1,
        accept: "image/*",
        onDrop: l,
        disabled: r
    });
    return y.createElement(ye, {
        input: !0
    }, y.createElement($e, null, e), y.createElement(qv, null, y.createElement(Gv, {
        ref: o,
        hasImage: !!t,
        onPointerDown: () => !!t && a(),
        onPointerUp: c,
        style: {
            backgroundImage: t ? `url(${t})` : "none"
        }
    }), s && !!t && y.createElement(Fo, null, y.createElement($c, {
        onPointerUp: c,
        style: {
            cursor: "pointer"
        }
    }), y.createElement(Yv, {
        ref: i,
        style: {
            backgroundImage: `url(${t})`
        }
    })), y.createElement(Kv, f({
        isDragAccept: h
    }), y.createElement("input", d()), y.createElement(Qv, null, h ? "drop image" : "click or drop")), y.createElement(Xv, {
        onClick: u,
        disabled: !t
    })))
}
var Zv = F({
    component: Jv
}, Uv);
const Rs = fe().number(),
    eb = (e, t) => fe().array().length(2).every.number().test(e) && fe().schema({
        min: Rs,
        max: Rs
    }).test(t),
    Fn = e => ({
        min: e[0],
        max: e[1]
    }),
    ol = (e, {
        bounds: [t, n]
    }, r) => {
        const o = Array.isArray(e) ? Fn(e) : e,
            i = {
                min: r[0],
                max: r[1]
            },
            {
                min: s,
                max: a
            } = F(F({}, i), o);
        return [Ye(Number(s), t, Math.max(t, a)), Ye(Number(a), Math.min(n, s), n)]
    },
    tb = ({
        value: e,
        min: t,
        max: n
    }) => {
        const r = {
                min: t,
                max: n
            },
            o = Ic(Fn(e), {
                min: r,
                max: r
            }),
            i = [t, n],
            s = F(F({}, o), {}, {
                bounds: i
            });
        return {
            value: ol(Fn(e), s, e),
            settings: s
        }
    };
var nb = Object.freeze({
    __proto__: null,
    schema: eb,
    format: Fn,
    sanitize: ol,
    normalize: tb
});
const rb = ["value", "bounds", "onDrag"],
    ob = ["bounds"],
    ib = L("div", {
        display: "grid",
        columnGap: "$colGap",
        gridTemplateColumns: "auto calc($sizes$numberInputMinWidth * 2 + $space$rowGap)"
    });

function sb(e) {
    let {
        value: t,
        bounds: [n, r],
        onDrag: o
    } = e, i = K(e, rb);
    const s = g.useRef(null),
        a = g.useRef(null),
        c = g.useRef(null),
        l = g.useRef(0),
        u = Ne("sizes", "scrubberWidth"),
        f = Zt(({
            event: p,
            first: m,
            xy: [v],
            movement: [b],
            memo: _ = {}
        }) => {
            if (m) {
                const {
                    width: w,
                    left: C
                } = s.current.getBoundingClientRect();
                l.current = w - parseFloat(u);
                const E = p ?.target === a.current || p ?.target === c.current;
                _.pos = Dn((v - C) / w, n, r);
                const S = Math.abs(_.pos - t.min) - Math.abs(_.pos - t.max);
                _.key = S < 0 || S === 0 && _.pos <= t.min ? "min" : "max", E && (_.pos = t[_.key])
            }
            const x = _.pos + Dn(b / l.current, 0, r - n);
            return o({
                [_.key]: Qp(x, i[_.key])
            }), _
        }),
        d = `calc(${An(t.min,n,r)} * (100% - ${u} - 8px) + 4px)`,
        h = `calc(${1-An(t.max,n,r)} * (100% - ${u} - 8px) + 4px)`;
    return y.createElement(Rc, J({
        ref: s
    }, f()), y.createElement(Tc, null, y.createElement(Oc, {
        style: {
            left: d,
            right: h
        }
    })), y.createElement(co, {
        position: "left",
        ref: a,
        style: {
            left: d
        }
    }), y.createElement(co, {
        position: "right",
        ref: c,
        style: {
            right: h
        }
    }))
}

function ab() {
    const {
        label: e,
        displayValue: t,
        onUpdate: n,
        settings: r
    } = ie(), o = K(r, ob);
    return y.createElement(y.Fragment, null, y.createElement(ye, {
        input: !0
    }, y.createElement($e, null, e), y.createElement(ib, null, y.createElement(sb, J({
        value: t
    }, r, {
        onDrag: n
    })), y.createElement(Wo, {
        value: t,
        settings: o,
        onUpdate: n,
        innerLabelTrim: 0
    }))))
}
var cb = F({
    component: ab
}, nb);
const lb = () => {
        const e = new Map;
        return {
            on: (t, n) => {
                let r = e.get(t);
                r === void 0 && (r = new Set, e.set(t, r)), r.add(n)
            },
            off: (t, n) => {
                const r = e.get(t);
                r !== void 0 && (r.delete(n), r.size === 0 && e.delete(t))
            },
            emit: (t, ...n) => {
                const r = e.get(t);
                if (r !== void 0)
                    for (const o of r) o(...n)
            }
        }
    },
    ub = ["type", "value"],
    fb = ["onChange", "transient", "onEditStart", "onEditEnd"],
    db = function() {
        const t = Zm(ev(() => ({
                data: {}
            }))),
            n = lb();
        this.storeId = ap(), this.useStore = t;
        const r = {},
            o = new Set;
        this.getVisiblePaths = () => {
            const s = this.getData(),
                a = Object.keys(s),
                c = [];
            Object.entries(r).forEach(([u, f]) => {
                f.render && a.some(d => d.indexOf(u) === 0) && !f.render(this.get) && c.push(u + ".")
            });
            const l = [];
            return o.forEach(u => {
                u in s && s[u].__refCount > 0 && c.every(f => u.indexOf(f) === -1) && (!s[u].render || s[u].render(this.get)) && l.push(u)
            }), l
        }, this.setOrderedPaths = s => {
            s.forEach(a => o.add(a))
        }, this.orderPaths = s => (this.setOrderedPaths(s), s), this.disposePaths = s => {
            t.setState(a => {
                const c = a.data;
                return s.forEach(l => {
                    if (l in c) {
                        const u = c[l];
                        u.__refCount--, u.__refCount === 0 && u.type in Oe && delete c[l]
                    }
                }), {
                    data: c
                }
            })
        }, this.dispose = () => {
            t.setState(() => ({
                data: {}
            }))
        }, this.getFolderSettings = s => r[s] || {}, this.getData = () => t.getState().data, this.addData = (s, a) => {
            t.setState(c => {
                const l = c.data;
                return Object.entries(s).forEach(([u, f]) => {
                    let d = l[u];
                    if (d) {
                        const {
                            type: h,
                            value: p
                        } = f, m = K(f, ub);
                        h !== d.type ? Le(Z.INPUT_TYPE_OVERRIDE, u, d.type, h) : ((d.__refCount === 0 || a) && Object.assign(d, m), d.__refCount++)
                    } else l[u] = F(F({}, f), {}, {
                        __refCount: 1
                    })
                }), {
                    data: l
                }
            })
        }, this.setValueAtPath = (s, a, c) => {
            t.setState(l => {
                const u = l.data;
                return zi(u[s], a, s, this, c), {
                    data: u
                }
            })
        }, this.setSettingsAtPath = (s, a) => {
            t.setState(c => {
                const l = c.data;
                return l[s].settings = F(F({}, l[s].settings), a), {
                    data: l
                }
            })
        }, this.disableInputAtPath = (s, a) => {
            t.setState(c => {
                const l = c.data;
                return l[s].disabled = a, {
                    data: l
                }
            })
        }, this.set = (s, a) => {
            t.setState(c => {
                const l = c.data;
                return Object.entries(s).forEach(([u, f]) => {
                    try {
                        zi(l[u], f, void 0, void 0, a)
                    } catch {}
                }), {
                    data: l
                }
            })
        }, this.getInput = s => {
            try {
                return this.getData()[s]
            } catch {
                Le(Z.PATH_DOESNT_EXIST, s)
            }
        }, this.get = s => {
            var a;
            return (a = this.getInput(s)) === null || a === void 0 ? void 0 : a.value
        }, this.emitOnEditStart = s => {
            n.emit(`onEditStart:${s}`, this.get(s), s, F(F({}, this.getInput(s)), {}, {
                get: this.get
            }))
        }, this.emitOnEditEnd = s => {
            n.emit(`onEditEnd:${s}`, this.get(s), s, F(F({}, this.getInput(s)), {}, {
                get: this.get
            }))
        }, this.subscribeToEditStart = (s, a) => {
            const c = `onEditStart:${s}`;
            return n.on(c, a), () => n.off(c, a)
        }, this.subscribeToEditEnd = (s, a) => {
            const c = `onEditEnd:${s}`;
            return n.on(c, a), () => n.off(c, a)
        };
        const i = (s, a, c) => {
            const l = {};
            return Object.entries(s).forEach(([u, f]) => {
                if (u === "") return Le(Z.EMPTY_KEY);
                let d = Go(a, u);
                if (f.type === Oe.FOLDER) {
                    const h = i(f.schema, d, c);
                    Object.assign(l, h), d in r || (r[d] = f.settings)
                } else if (u in c) Le(Z.DUPLICATE_KEYS, u, d, c[u].path);
                else {
                    const h = gp(f, u, d, l);
                    if (h) {
                        const {
                            type: p,
                            options: m,
                            input: v
                        } = h, {
                            onChange: b,
                            transient: _,
                            onEditStart: x,
                            onEditEnd: w
                        } = m, C = K(m, fb);
                        l[d] = F(F(F({
                            type: p
                        }, C), v), {}, {
                            fromPanel: !0
                        }), c[u] = {
                            path: d,
                            onChange: b,
                            transient: _,
                            onEditStart: x,
                            onEditEnd: w
                        }
                    } else Le(Z.UNKNOWN_INPUT, d, f)
                }
            }), l
        };
        this.getDataFromSchema = s => {
            const a = {};
            return [i(s, "", a), a]
        }
    },
    il = new db,
    hb = {
        collapsed: !1
    };

function pb(e, t) {
    return {
        type: Oe.FOLDER,
        schema: e,
        settings: F(F({}, hb), t)
    }
}
const gb = {
    disabled: !1
};

function _0(e, t) {
    return {
        type: Oe.BUTTON,
        onClick: e,
        settings: F(F({}, gb), t)
    }
}
const Os = e => "__levaInput" in e,
    mb = (e, t) => {
        const n = {},
            r = t ? t.toLowerCase() : null;
        return e.forEach(o => {
            const [i, s] = gv(o);
            (!r || i.toLowerCase().indexOf(r) > -1) && pv(n, s, {
                [i]: {
                    __levaInput: !0,
                    path: o
                }
            })
        }), n
    },
    vb = ["type", "label", "path", "valueKey", "value", "settings", "setValue", "disabled"];

function bb(e) {
    let {
        type: t,
        label: n,
        path: r,
        valueKey: o,
        value: i,
        settings: s,
        setValue: a,
        disabled: c
    } = e, l = K(e, vb);
    const {
        displayValue: u,
        onChange: f,
        onUpdate: d
    } = Sc({
        type: t,
        value: i,
        settings: s,
        setValue: a
    }), h = rt[t].component;
    return h ? y.createElement(gc.Provider, {
        value: F({
            key: o,
            path: r,
            id: "" + r,
            label: n,
            displayValue: u,
            value: i,
            onChange: f,
            onUpdate: d,
            settings: s,
            setValue: a,
            disabled: c
        }, l)
    }, y.createElement(Dp, {
        disabled: c
    }, y.createElement(h, null))) : (Le(Z.NO_COMPONENT_FOR_TYPE, t, r), null)
}
const yb = L("button", {
    display: "block",
    $reset: "",
    fontWeight: "$button",
    height: "$rowHeight",
    borderStyle: "none",
    borderRadius: "$sm",
    backgroundColor: "$elevation1",
    color: "$highlight1",
    "&:not(:disabled)": {
        color: "$highlight3",
        backgroundColor: "$accent2",
        cursor: "pointer",
        $hover: "$accent3",
        $active: "$accent3 $accent1",
        $focus: ""
    }
});

function _b({
    onClick: e,
    settings: t,
    label: n
}) {
    const r = Xt();
    return y.createElement(ye, null, y.createElement(yb, {
        disabled: t.disabled,
        onClick: () => e(r.get)
    }, n))
}
const xb = L("div", {
        $flex: "",
        justifyContent: "flex-end",
        gap: "$colGap"
    }),
    wb = L("button", {
        $reset: "",
        cursor: "pointer",
        borderRadius: "$xs",
        "&:hover": {
            backgroundColor: "$elevation3"
        }
    }),
    Eb = ({
        label: e,
        opts: t
    }) => {
        let n = typeof e == "string" && e.trim() === "" ? null : e,
            r = t;
        return typeof t.opts == "object" && (r.label !== void 0 && (n = t.label), r = t.opts), {
            label: n,
            opts: r
        }
    };

function $b(e) {
    const {
        label: t,
        opts: n
    } = Eb(e), r = Xt();
    return y.createElement(ye, {
        input: !!t
    }, t && y.createElement($e, null, t), y.createElement(xb, null, Object.entries(n).map(([o, i]) => y.createElement(wb, {
        key: o,
        onClick: () => i(r.get)
    }, o))))
}
const Sb = L("canvas", {
        height: "$monitorHeight",
        width: "100%",
        display: "block",
        borderRadius: "$sm"
    }),
    sl = 100;

function Cb(e, t) {
    e.push(t), e.length > sl && e.shift()
}
const Tb = g.forwardRef(function({
        initialValue: e
    }, t) {
        const n = Ne("colors", "highlight3"),
            r = Ne("colors", "elevation2"),
            o = Ne("colors", "highlight1"),
            [i, s] = g.useMemo(() => [ce(o).alpha(.4).toRgbString(), ce(o).alpha(.1).toRgbString()], [o]),
            a = g.useRef([e]),
            c = g.useRef(e),
            l = g.useRef(e),
            u = g.useRef(),
            f = g.useCallback((p, m) => {
                if (!p) return;
                const {
                    width: v,
                    height: b
                } = p, _ = new Path2D, x = v / sl, w = b * .05;
                for (let S = 0; S < a.current.length; S++) {
                    const R = An(a.current[S], c.current, l.current),
                        j = x * S,
                        T = b - R * (b - w * 2) - w;
                    _.lineTo(j, T)
                }
                m.clearRect(0, 0, v, b);
                const C = new Path2D(_);
                C.lineTo(x * (a.current.length + 1), b), C.lineTo(0, b), C.lineTo(0, 0);
                const E = m.createLinearGradient(0, 0, 0, b);
                E.addColorStop(0, i), E.addColorStop(1, s), m.fillStyle = E, m.fill(C), m.strokeStyle = r, m.lineJoin = "round", m.lineWidth = 14, m.stroke(_), m.strokeStyle = n, m.lineWidth = 2, m.stroke(_)
            }, [n, r, i, s]),
            [d, h] = Hp(f);
        return g.useImperativeHandle(t, () => ({
            frame: p => {
                (c.current === void 0 || p < c.current) && (c.current = p), (l.current === void 0 || p > l.current) && (l.current = p), Cb(a.current, p), u.current = requestAnimationFrame(() => f(d.current, h.current))
            }
        }), [d, h, f]), g.useEffect(() => () => cancelAnimationFrame(u.current), []), y.createElement(Sb, {
            ref: d
        })
    }),
    ks = e => Number.isFinite(e) ? e.toPrecision(2) : e.toString(),
    Rb = g.forwardRef(function({
        initialValue: e
    }, t) {
        const [n, r] = g.useState(ks(e));
        return g.useImperativeHandle(t, () => ({
            frame: o => r(ks(o))
        }), []), y.createElement("div", null, n)
    });

function Is(e) {
    return typeof e == "function" ? e() : e.current
}

function Ob({
    label: e,
    objectOrFn: t,
    settings: n
}) {
    const r = g.useRef(),
        o = g.useRef(Is(t));
    return g.useEffect(() => {
        const i = window.setInterval(() => {
            var s;
            document.hidden || (s = r.current) === null || s === void 0 || s.frame(Is(t))
        }, n.interval);
        return () => window.clearInterval(i)
    }, [t, n.interval]), y.createElement(ye, {
        input: !0
    }, y.createElement($e, {
        align: "top"
    }, e), n.graph ? y.createElement(Tb, {
        ref: r,
        initialValue: o.current
    }) : y.createElement(Rb, {
        ref: r,
        initialValue: o.current
    }))
}
const kb = ["type", "label", "key"],
    Ib = {
        [Oe.BUTTON]: _b,
        [Oe.BUTTON_GROUP]: $b,
        [Oe.MONITOR]: Ob
    },
    Pb = y.memo(({
        path: e
    }) => {
        const [t, {
            set: n,
            setSettings: r,
            disable: o,
            storeId: i,
            emitOnEditStart: s,
            emitOnEditEnd: a
        }] = Up(e);
        if (!t) return null;
        const {
            type: c,
            label: l,
            key: u
        } = t, f = K(t, kb);
        if (c in Oe) {
            const d = Ib[c];
            return y.createElement(d, J({
                label: l,
                path: e
            }, f))
        }
        return c in rt ? y.createElement(bb, J({
            key: i + e,
            type: c,
            label: l,
            storeId: i,
            path: e,
            valueKey: u,
            setValue: n,
            setSettings: r,
            disable: o,
            emitOnEditStart: s,
            emitOnEditEnd: a
        }, f)) : (Xh(Z.UNSUPPORTED_INPUT, c, e), null)
    });

function Ab({
    toggle: e,
    toggled: t,
    name: n
}) {
    return y.createElement(Ip, {
        onClick: () => e()
    }, y.createElement(zo, {
        toggled: t
    }), y.createElement("div", null, n))
}
const Db = ({
        name: e,
        path: t,
        tree: n
    }) => {
        const r = Xt(),
            o = Go(t, e),
            {
                collapsed: i,
                color: s
            } = r.getFolderSettings(o),
            [a, c] = g.useState(!i),
            l = g.useRef(null),
            u = Ne("colors", "folderWidgetColor"),
            f = Ne("colors", "folderTextColor");
        return g.useLayoutEffect(() => {
            l.current.style.setProperty("--leva-colors-folderWidgetColor", s || u), l.current.style.setProperty("--leva-colors-folderTextColor", s || f)
        }, [s, u, f]), y.createElement(Mn, {
            ref: l
        }, y.createElement(Ab, {
            name: e,
            toggled: a,
            toggle: () => c(d => !d)
        }), y.createElement(al, {
            parent: o,
            tree: n,
            toggled: a
        }))
    },
    al = y.memo(({
        isRoot: e = !1,
        fill: t = !1,
        flat: n = !1,
        parent: r,
        tree: o,
        toggled: i
    }) => {
        const {
            wrapperRef: s,
            contentRef: a
        } = bv(i), c = Xt(), l = ([f, d]) => {
            var h;
            return (Os(d) ? (h = c.getInput(d.path)) === null || h === void 0 ? void 0 : h.order : c.getFolderSettings(Go(r, f)).order) || 0
        }, u = Object.entries(o).sort((f, d) => l(f) - l(d));
        return y.createElement(so, {
            ref: s,
            isRoot: e,
            fill: t,
            flat: n
        }, y.createElement(xc, {
            ref: a,
            isRoot: e,
            toggled: i
        }, u.map(([f, d]) => Os(d) ? y.createElement(Pb, {
            key: d.path,
            valueKey: d.valueKey,
            path: d.path
        }) : y.createElement(Db, {
            key: f,
            name: f,
            path: r,
            tree: d
        }))))
    }),
    Mb = L("div", {
        position: "relative",
        fontFamily: "$mono",
        fontSize: "$root",
        color: "$rootText",
        backgroundColor: "$elevation1",
        variants: {
            fill: {
                false: {
                    position: "fixed",
                    top: "10px",
                    right: "10px",
                    zIndex: 1e3,
                    width: "$rootWidth"
                },
                true: {
                    position: "relative",
                    width: "100%"
                }
            },
            flat: {
                false: {
                    borderRadius: "$lg",
                    boxShadow: "$level1"
                }
            },
            oneLineLabels: {
                true: {
                    [`${Ec}`]: {
                        gridTemplateColumns: "auto",
                        gridAutoColumns: "minmax(max-content, 1fr)",
                        gridAutoRows: "minmax($sizes$rowHeight), auto)",
                        rowGap: 0,
                        columnGap: 0,
                        marginTop: "$rowGap"
                    }
                }
            },
            hideTitleBar: {
                true: {
                    $$titleBarHeight: "0px"
                },
                false: {
                    $$titleBarHeight: "$sizes$titleBarHeight"
                }
            }
        },
        "&,*,*:after,*:before": {
            boxSizing: "border-box"
        },
        "*::selection": {
            backgroundColor: "$accent2"
        }
    }),
    cl = 40,
    zn = L("i", {
        $flexCenter: "",
        width: cl,
        userSelect: "none",
        cursor: "pointer",
        "> svg": {
            fill: "$highlight1",
            transition: "transform 350ms ease, fill 250ms ease"
        },
        "&:hover > svg": {
            fill: "$highlight3"
        },
        variants: {
            active: {
                true: {
                    "> svg": {
                        fill: "$highlight2"
                    }
                }
            }
        }
    }),
    jb = L("div", {
        display: "flex",
        alignItems: "stretch",
        justifyContent: "space-between",
        height: "$titleBarHeight",
        variants: {
            mode: {
                drag: {
                    cursor: "grab"
                }
            }
        }
    }),
    Lb = L("div", {
        $flex: "",
        position: "relative",
        width: "100%",
        overflow: "hidden",
        transition: "height 250ms ease",
        color: "$highlight3",
        paddingLeft: "$md",
        [`> ${zn}`]: {
            height: 30
        },
        variants: {
            toggled: {
                true: {
                    height: 30
                },
                false: {
                    height: 0
                }
            }
        }
    }),
    Nb = L("input", {
        $reset: "",
        flex: 1,
        position: "relative",
        height: 30,
        width: "100%",
        backgroundColor: "transparent",
        fontSize: "10px",
        borderRadius: "$root",
        "&:focus": {},
        "&::placeholder": {
            color: "$highlight2"
        }
    }),
    Fb = L("div", {
        touchAction: "none",
        $flexCenter: "",
        flex: 1,
        "> svg": {
            fill: "$highlight1"
        },
        color: "$highlight1",
        variants: {
            drag: {
                true: {
                    $draggable: "",
                    "> svg": {
                        transition: "fill 250ms ease"
                    },
                    "&:hover": {
                        color: "$highlight3"
                    },
                    "&:hover > svg": {
                        fill: "$highlight3"
                    }
                }
            },
            filterEnabled: {
                false: {
                    paddingRight: cl
                }
            }
        }
    }),
    zb = y.forwardRef(({
        setFilter: e,
        toggle: t
    }, n) => {
        const [r, o] = g.useState(""), i = g.useMemo(() => lc(e, 250), [e]), s = () => {
            e(""), o("")
        }, a = c => {
            const l = c.currentTarget.value;
            t(!0), o(l)
        };
        return g.useEffect(() => {
            i(r)
        }, [r, i]), y.createElement(y.Fragment, null, y.createElement(Nb, {
            ref: n,
            value: r,
            placeholder: "[Open filter with CMD+SHIFT+L]",
            onPointerDown: c => c.stopPropagation(),
            onChange: a
        }), y.createElement(zn, {
            onClick: () => s(),
            style: {
                visibility: r ? "visible" : "hidden"
            }
        }, y.createElement("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            height: "14",
            width: "14",
            viewBox: "0 0 20 20",
            fill: "currentColor"
        }, y.createElement("path", {
            fillRule: "evenodd",
            d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",
            clipRule: "evenodd"
        }))))
    });

function Wb({
    setFilter: e,
    onDrag: t,
    onDragStart: n,
    onDragEnd: r,
    toggle: o,
    toggled: i,
    title: s,
    drag: a,
    filterEnabled: c,
    from: l
}) {
    const [u, f] = g.useState(!1), d = g.useRef(null);
    g.useEffect(() => {
        var p, m;
        u ? (p = d.current) === null || p === void 0 || p.focus() : (m = d.current) === null || m === void 0 || m.blur()
    }, [u]);
    const h = Zt(({
        offset: [p, m],
        first: v,
        last: b
    }) => {
        t({
            x: p,
            y: m
        }), v && n({
            x: p,
            y: m
        }), b && r({
            x: p,
            y: m
        })
    }, {
        filterTaps: !0,
        from: ({
            offset: [p, m]
        }) => [l ?.x || p, l ?.y || m]
    });
    return g.useEffect(() => {
        const p = m => {
            m.key === "L" && m.shiftKey && m.metaKey && f(v => !v)
        };
        return window.addEventListener("keydown", p), () => window.removeEventListener("keydown", p)
    }, []), y.createElement(y.Fragment, null, y.createElement(jb, {
        mode: a ? "drag" : void 0
    }, y.createElement(zn, {
        active: !i,
        onClick: () => o()
    }, y.createElement(zo, {
        toggled: i,
        width: 12,
        height: 8
    })), y.createElement(Fb, J({}, a ? h() : {}, {
        drag: a,
        filterEnabled: c
    }), s === void 0 && a ? y.createElement("svg", {
        width: "20",
        height: "10",
        viewBox: "0 0 28 14",
        xmlns: "http://www.w3.org/2000/svg"
    }, y.createElement("circle", {
        cx: "2",
        cy: "2",
        r: "2"
    }), y.createElement("circle", {
        cx: "14",
        cy: "2",
        r: "2"
    }), y.createElement("circle", {
        cx: "26",
        cy: "2",
        r: "2"
    }), y.createElement("circle", {
        cx: "2",
        cy: "12",
        r: "2"
    }), y.createElement("circle", {
        cx: "14",
        cy: "12",
        r: "2"
    }), y.createElement("circle", {
        cx: "26",
        cy: "12",
        r: "2"
    })) : s), c && y.createElement(zn, {
        active: u,
        onClick: () => f(p => !p)
    }, y.createElement("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        height: "20",
        viewBox: "0 0 20 20"
    }, y.createElement("path", {
        d: "M9 9a2 2 0 114 0 2 2 0 01-4 0z"
    }), y.createElement("path", {
        fillRule: "evenodd",
        d: "M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z",
        clipRule: "evenodd"
    })))), y.createElement(Lb, {
        toggled: u
    }, y.createElement(zb, {
        ref: d,
        setFilter: e,
        toggle: o
    })))
}
const Bb = ["store", "hidden", "theme", "collapsed"];

function Hb(e) {
    let {
        store: t,
        hidden: n = !1,
        theme: r,
        collapsed: o = !1
    } = e, i = K(e, Bb);
    const s = Zc(() => Sp(r), [r]),
        [a, c] = g.useState(!o),
        l = typeof o == "object" ? !o.collapsed : a,
        u = g.useMemo(() => typeof o == "object" ? f => {
            typeof f == "function" ? o.onChange(!f(!o.collapsed)) : o.onChange(!f)
        } : c, [o]);
    return !t || n ? null : y.createElement(Lo.Provider, {
        value: s
    }, y.createElement(Vb, J({
        store: t
    }, i, {
        toggled: l,
        setToggle: u,
        rootClass: s.className
    })))
}
const Vb = y.memo(({
        store: e,
        rootClass: t,
        fill: n = !1,
        flat: r = !1,
        neverHide: o = !1,
        oneLineLabels: i = !1,
        titleBar: s = {
            title: void 0,
            drag: !0,
            filter: !0,
            position: void 0,
            onDrag: void 0,
            onDragStart: void 0,
            onDragEnd: void 0
        },
        hideCopyButton: a = !1,
        toggled: c,
        setToggle: l
    }) => {
        var u, f;
        const d = yv(e),
            [h, p] = g.useState(""),
            m = g.useMemo(() => mb(d, h), [d, h]),
            [v, b] = Cc(),
            _ = o || d.length > 0,
            x = typeof s == "object" && s.title || void 0,
            w = typeof s == "object" && (u = s.drag) !== null && u !== void 0 ? u : !0,
            C = typeof s == "object" && (f = s.filter) !== null && f !== void 0 ? f : !0,
            E = typeof s == "object" && s.position || void 0,
            S = typeof s == "object" && s.onDrag || void 0,
            R = typeof s == "object" && s.onDragStart || void 0,
            j = typeof s == "object" && s.onDragEnd || void 0;
        return y.useEffect(() => {
            b({
                x: E ?.x,
                y: E ?.y
            })
        }, [E, b]), $p(), y.createElement(Vh, null, y.createElement(vc.Provider, {
            value: {
                hideCopyButton: a
            }
        }, y.createElement(Mb, {
            ref: v,
            className: t,
            fill: n,
            flat: r,
            oneLineLabels: i,
            hideTitleBar: !s,
            style: {
                display: _ ? "block" : "none"
            }
        }, s && y.createElement(Wb, {
            onDrag: T => {
                b(T), S ?.(T)
            },
            onDragStart: T => R ?.(T),
            onDragEnd: T => j ?.(T),
            setFilter: p,
            toggle: T => l(O => T ?? !O),
            toggled: c,
            title: x,
            drag: w,
            filterEnabled: C,
            from: E
        }), _ && y.createElement(mc.Provider, {
            value: e
        }, y.createElement(al, {
            isRoot: !0,
            fill: n,
            flat: r,
            tree: m,
            toggled: c
        })))))
    }),
    Ub = ["isRoot"];
let Wn = !1,
    Je = null;

function qb(e) {
    let {
        isRoot: t = !1
    } = e, n = K(e, Ub);
    return g.useEffect(() => (Wn = !0, !t && Je && (Je.remove(), Je = null), () => {
        t || (Wn = !1)
    }), [t]), y.createElement(Hb, J({
        store: il
    }, n))
}

function Kb(e) {
    g.useEffect(() => {
        e && !Wn && (Je || (Je = document.getElementById("leva__root") || Object.assign(document.createElement("div"), {
            id: "leva__root"
        }), document.body && (document.body.appendChild(Je), Tl.createRoot(Je).render(y.createElement(qb, {
            isRoot: !0
        })))), Wn = !0)
    }, [e])
}

function Gb(e, t, n, r, o) {
    let i, s, a, c, l;
    return typeof e == "string" ? (s = e, i = t, Array.isArray(n) && (l = n)) : (i = e, Array.isArray(t) ? l = t : (c = t, l = n)), {
        schema: i,
        folderName: s,
        folderSettings: a,
        hookSettings: c,
        deps: l || []
    }
}

function x0(e, t, n, r, o) {
    const {
        folderName: i,
        schema: s,
        folderSettings: a,
        hookSettings: c,
        deps: l
    } = Gb(e, t, n), u = typeof s == "function", f = g.useRef(!1), d = g.useRef(!0), h = Zc(() => {
        f.current = !0;
        const O = typeof s == "function" ? s() : s;
        return i ? {
            [i]: pb(O, a)
        } : O
    }, l), p = !(c != null && c.store);
    Kb(p);
    const [m] = g.useState(() => c ?.store || il), [v, b] = g.useMemo(() => m.getDataFromSchema(h), [m, h]), [_, x, w, C, E] = g.useMemo(() => {
        const O = [],
            k = [],
            A = {},
            M = {},
            N = {};
        return Object.values(b).forEach(({
            path: W,
            onChange: V,
            onEditStart: I,
            onEditEnd: U,
            transient: te
        }) => {
            O.push(W), V ? (A[W] = V, te || k.push(W)) : k.push(W), I && (M[W] = I), U && (N[W] = U)
        }), [O, k, A, M, N]
    }, [b]), S = g.useMemo(() => m.orderPaths(_), [_, m]), R = _v(m, x, v), j = g.useCallback(O => {
        const k = Object.entries(O).reduce((A, [M, N]) => Object.assign(A, {
            [b[M].path]: N
        }), {});
        m.set(k, !1)
    }, [m, b]), T = g.useCallback(O => m.get(b[O].path), [m, b]);
    return g.useEffect(() => {
        const O = !d.current && f.current;
        return m.addData(v, O), d.current = !1, f.current = !1, () => m.disposePaths(S)
    }, [m, S, v]), g.useEffect(() => {
        const O = [];
        return Object.entries(w).forEach(([k, A]) => {
            A(m.get(k), k, F({
                initial: !0,
                get: m.get
            }, m.getInput(k)));
            const M = m.useStore.subscribe(N => {
                const W = N.data[k];
                return [W.disabled ? void 0 : W.value, W]
            }, ([N, W]) => A(N, k, F({
                initial: !1,
                get: m.get
            }, W)), {
                equalityFn: Hn
            });
            O.push(M)
        }), () => O.forEach(k => k())
    }, [m, w]), g.useEffect(() => {
        const O = [];
        return Object.entries(C).forEach(([k, A]) => O.push(m.subscribeToEditStart(k, A))), Object.entries(E).forEach(([k, A]) => O.push(m.subscribeToEditEnd(k, A))), () => O.forEach(k => k())
    }, [C, E, m]), u ? [R, j, T] : R
}
Ve(Ue.SELECT, cg);
Ve(Ue.IMAGE, Zv);
Ve(Ue.NUMBER, Jp);
Ve(Ue.COLOR, Iv);
Ve(Ue.STRING, vg);
Ve(Ue.BOOLEAN, $g);
Ve(Ue.INTERVAL, cb);
Ve(Ue.VECTOR3D, Av);
Ve(Ue.VECTOR2D, Wv);
var Wr = {
        exports: {}
    },
    Br = {},
    Hr = {
        exports: {}
    },
    Vr = {};
var Ps;

function Yb() {
    if (Ps) return Vr;
    Ps = 1;
    var e = Zs();

    function t(f, d) {
        return f === d && (f !== 0 || 1 / f === 1 / d) || f !== f && d !== d
    }
    var n = typeof Object.is == "function" ? Object.is : t,
        r = e.useState,
        o = e.useEffect,
        i = e.useLayoutEffect,
        s = e.useDebugValue;

    function a(f, d) {
        var h = d(),
            p = r({
                inst: {
                    value: h,
                    getSnapshot: d
                }
            }),
            m = p[0].inst,
            v = p[1];
        return i(function() {
            m.value = h, m.getSnapshot = d, c(m) && v({
                inst: m
            })
        }, [f, h, d]), o(function() {
            return c(m) && v({
                inst: m
            }), f(function() {
                c(m) && v({
                    inst: m
                })
            })
        }, [f]), s(h), h
    }

    function c(f) {
        var d = f.getSnapshot;
        f = f.value;
        try {
            var h = d();
            return !n(f, h)
        } catch {
            return !0
        }
    }

    function l(f, d) {
        return d()
    }
    var u = typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u" ? l : a;
    return Vr.useSyncExternalStore = e.useSyncExternalStore !== void 0 ? e.useSyncExternalStore : u, Vr
}
var As;

function Qb() {
    return As || (As = 1, Hr.exports = Yb()), Hr.exports
}
var Ds;

function Xb() {
    if (Ds) return Br;
    Ds = 1;
    var e = Zs(),
        t = Qb();

    function n(l, u) {
        return l === u && (l !== 0 || 1 / l === 1 / u) || l !== l && u !== u
    }
    var r = typeof Object.is == "function" ? Object.is : n,
        o = t.useSyncExternalStore,
        i = e.useRef,
        s = e.useEffect,
        a = e.useMemo,
        c = e.useDebugValue;
    return Br.useSyncExternalStoreWithSelector = function(l, u, f, d, h) {
        var p = i(null);
        if (p.current === null) {
            var m = {
                hasValue: !1,
                value: null
            };
            p.current = m
        } else m = p.current;
        p = a(function() {
            function b(E) {
                if (!_) {
                    if (_ = !0, x = E, E = d(E), h !== void 0 && m.hasValue) {
                        var S = m.value;
                        if (h(S, E)) return w = S
                    }
                    return w = E
                }
                if (S = w, r(x, E)) return S;
                var R = d(E);
                return h !== void 0 && h(S, R) ? (x = E, S) : (x = E, w = R)
            }
            var _ = !1,
                x, w, C = f === void 0 ? null : f;
            return [function() {
                return b(u())
            }, C === null ? void 0 : function() {
                return b(C())
            }]
        }, [u, f, d, h]);
        var v = o(l, p[0], p[1]);
        return s(function() {
            m.hasValue = !0, m.value = v
        }, [v]), c(v), v
    }, Br
}
var Ms;

function Jb() {
    return Ms || (Ms = 1, Wr.exports = Xb()), Wr.exports
}
var Zb = Jb();
const ey = qt(Zb),
    ty = {},
    js = e => {
        let t;
        const n = new Set,
            r = (u, f) => {
                const d = typeof u == "function" ? u(t) : u;
                if (!Object.is(d, t)) {
                    const h = t;
                    t = f ?? (typeof d != "object" || d === null) ? d : Object.assign({}, t, d), n.forEach(p => p(t, h))
                }
            },
            o = () => t,
            c = {
                setState: r,
                getState: o,
                getInitialState: () => l,
                subscribe: u => (n.add(u), () => n.delete(u)),
                destroy: () => {
                    (ty ? "production" : void 0) !== "production" && console.warn("[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected."), n.clear()
                }
            },
            l = t = e(r, o, c);
        return c
    },
    ny = e => e ? js(e) : js,
    ll = {},
    {
        useDebugValue: ry
    } = y,
    {
        useSyncExternalStoreWithSelector: oy
    } = ey;
let Ls = !1;
const iy = e => e;

function sy(e, t = iy, n) {
    (ll ? "production" : void 0) !== "production" && n && !Ls && (console.warn("[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937"), Ls = !0);
    const r = oy(e.subscribe, e.getState, e.getServerState || e.getInitialState, t, n);
    return ry(r), r
}
const Ns = e => {
        (ll ? "production" : void 0) !== "production" && typeof e != "function" && console.warn("[DEPRECATED] Passing a vanilla store will be unsupported in a future version. Instead use `import { useStore } from 'zustand'`.");
        const t = typeof e == "function" ? ny(e) : e,
            n = (r, o) => sy(t, r, o);
        return Object.assign(n, t), n
    },
    w0 = e => e ? Ns(e) : Ns,
    Fs = e => {
        let t;
        const n = new Set,
            r = (l, u) => {
                const f = typeof l == "function" ? l(t) : l;
                if (!Object.is(f, t)) {
                    const d = t;
                    t = u ?? (typeof f != "object" || f === null) ? f : Object.assign({}, t, f), n.forEach(h => h(t, d))
                }
            },
            o = () => t,
            a = {
                setState: r,
                getState: o,
                getInitialState: () => c,
                subscribe: l => (n.add(l), () => n.delete(l))
            },
            c = t = e(r, o, a);
        return a
    },
    ay = (e => e ? Fs(e) : Fs),
    cy = e => e;

function ly(e, t = cy) {
    const n = y.useSyncExternalStore(e.subscribe, y.useCallback(() => t(e.getState()), [e, t]), y.useCallback(() => t(e.getInitialState()), [e, t]));
    return y.useDebugValue(n), n
}
const zs = e => {
        const t = ay(e),
            n = r => ly(t, r);
        return Object.assign(n, t), n
    },
    E0 = (e => e ? zs(e) : zs);

function uy(e, t) {
    let n;
    try {
        n = e()
    } catch {
        return
    }
    return {
        getItem: o => {
            var i;
            const s = c => c === null ? null : JSON.parse(c, void 0),
                a = (i = n.getItem(o)) != null ? i : null;
            return a instanceof Promise ? a.then(s) : s(a)
        },
        setItem: (o, i) => n.setItem(o, JSON.stringify(i, void 0)),
        removeItem: o => n.removeItem(o)
    }
}
const _o = e => t => {
        try {
            const n = e(t);
            return n instanceof Promise ? n : {
                then(r) {
                    return _o(r)(n)
                },
                catch (r) {
                    return this
                }
            }
        } catch (n) {
            return {
                then(r) {
                    return this
                },
                catch (r) {
                    return _o(r)(n)
                }
            }
        }
    },
    fy = (e, t) => (n, r, o) => {
        let i = {
                storage: uy(() => window.localStorage),
                partialize: v => v,
                version: 0,
                merge: (v, b) => ({ ...b,
                    ...v
                }),
                ...t
            },
            s = !1,
            a = 0;
        const c = new Set,
            l = new Set;
        let u = i.storage;
        if (!u) return e((...v) => {
            console.warn(`[zustand persist middleware] Unable to update item '${i.name}', the given storage is currently unavailable.`), n(...v)
        }, r, o);
        const f = () => {
                const v = i.partialize({ ...r()
                });
                return u.setItem(i.name, {
                    state: v,
                    version: i.version
                })
            },
            d = o.setState;
        o.setState = (v, b) => (d(v, b), f());
        const h = e((...v) => (n(...v), f()), r, o);
        o.getInitialState = () => h;
        let p;
        const m = () => {
            var v, b;
            if (!u) return;
            const _ = ++a;
            s = !1, c.forEach(w => {
                var C;
                return w((C = r()) != null ? C : h)
            });
            const x = ((b = i.onRehydrateStorage) == null ? void 0 : b.call(i, (v = r()) != null ? v : h)) || void 0;
            return _o(u.getItem.bind(u))(i.name).then(w => {
                if (w)
                    if (typeof w.version == "number" && w.version !== i.version) {
                        if (i.migrate) {
                            const C = i.migrate(w.state, w.version);
                            return C instanceof Promise ? C.then(E => [!0, E]) : [!0, C]
                        }
                        console.error("State loaded from storage couldn't be migrated since no migrate function was provided")
                    } else return [!1, w.state];
                return [!1, void 0]
            }).then(w => {
                var C;
                if (_ !== a) return;
                const [E, S] = w;
                if (p = i.merge(S, (C = r()) != null ? C : h), n(p, !0), E) return f()
            }).then(() => {
                _ === a && (x ?.(r(), void 0), p = r(), s = !0, l.forEach(w => w(p)))
            }).catch(w => {
                _ === a && x ?.(void 0, w)
            })
        };
        return o.persist = {
            setOptions: v => {
                i = { ...i,
                    ...v
                }, v.storage && (u = v.storage)
            },
            clearStorage: () => {
                u ?.removeItem(i.name)
            },
            getOptions: () => i,
            rehydrate: () => m(),
            hasHydrated: () => s,
            onHydrate: v => (c.add(v), () => {
                c.delete(v)
            }),
            onFinishHydration: v => (l.add(v), () => {
                l.delete(v)
            })
        }, i.skipHydration || m(), p || h
    },
    $0 = fy,
    dy = e => {
        let t;
        const n = new Set,
            r = (l, u) => {
                const f = typeof l == "function" ? l(t) : l;
                if (!Object.is(f, t)) {
                    const d = t;
                    t = u ?? (typeof f != "object" || f === null) ? f : Object.assign({}, t, f), n.forEach(h => h(t, d))
                }
            },
            o = () => t,
            a = {
                setState: r,
                getState: o,
                getInitialState: () => c,
                subscribe: l => (n.add(l), () => n.delete(l))
            },
            c = t = e(r, o, a);
        return a
    },
    S0 = (e => dy);
var Ur = {
        exports: {}
    },
    Ws;

function hy() {
    return Ws || (Ws = 1, (function(e) {
        var t = Object.prototype.hasOwnProperty,
            n = "~";

        function r() {}
        Object.create && (r.prototype = Object.create(null), new r().__proto__ || (n = !1));

        function o(c, l, u) {
            this.fn = c, this.context = l, this.once = u || !1
        }

        function i(c, l, u, f, d) {
            if (typeof u != "function") throw new TypeError("The listener must be a function");
            var h = new o(u, f || c, d),
                p = n ? n + l : l;
            return c._events[p] ? c._events[p].fn ? c._events[p] = [c._events[p], h] : c._events[p].push(h) : (c._events[p] = h, c._eventsCount++), c
        }

        function s(c, l) {
            --c._eventsCount === 0 ? c._events = new r : delete c._events[l]
        }

        function a() {
            this._events = new r, this._eventsCount = 0
        }
        a.prototype.eventNames = function() {
            var l = [],
                u, f;
            if (this._eventsCount === 0) return l;
            for (f in u = this._events) t.call(u, f) && l.push(n ? f.slice(1) : f);
            return Object.getOwnPropertySymbols ? l.concat(Object.getOwnPropertySymbols(u)) : l
        }, a.prototype.listeners = function(l) {
            var u = n ? n + l : l,
                f = this._events[u];
            if (!f) return [];
            if (f.fn) return [f.fn];
            for (var d = 0, h = f.length, p = new Array(h); d < h; d++) p[d] = f[d].fn;
            return p
        }, a.prototype.listenerCount = function(l) {
            var u = n ? n + l : l,
                f = this._events[u];
            return f ? f.fn ? 1 : f.length : 0
        }, a.prototype.emit = function(l, u, f, d, h, p) {
            var m = n ? n + l : l;
            if (!this._events[m]) return !1;
            var v = this._events[m],
                b = arguments.length,
                _, x;
            if (v.fn) {
                switch (v.once && this.removeListener(l, v.fn, void 0, !0), b) {
                    case 1:
                        return v.fn.call(v.context), !0;
                    case 2:
                        return v.fn.call(v.context, u), !0;
                    case 3:
                        return v.fn.call(v.context, u, f), !0;
                    case 4:
                        return v.fn.call(v.context, u, f, d), !0;
                    case 5:
                        return v.fn.call(v.context, u, f, d, h), !0;
                    case 6:
                        return v.fn.call(v.context, u, f, d, h, p), !0
                }
                for (x = 1, _ = new Array(b - 1); x < b; x++) _[x - 1] = arguments[x];
                v.fn.apply(v.context, _)
            } else {
                var w = v.length,
                    C;
                for (x = 0; x < w; x++) switch (v[x].once && this.removeListener(l, v[x].fn, void 0, !0), b) {
                    case 1:
                        v[x].fn.call(v[x].context);
                        break;
                    case 2:
                        v[x].fn.call(v[x].context, u);
                        break;
                    case 3:
                        v[x].fn.call(v[x].context, u, f);
                        break;
                    case 4:
                        v[x].fn.call(v[x].context, u, f, d);
                        break;
                    default:
                        if (!_)
                            for (C = 1, _ = new Array(b - 1); C < b; C++) _[C - 1] = arguments[C];
                        v[x].fn.apply(v[x].context, _)
                }
            }
            return !0
        }, a.prototype.on = function(l, u, f) {
            return i(this, l, u, f, !1)
        }, a.prototype.once = function(l, u, f) {
            return i(this, l, u, f, !0)
        }, a.prototype.removeListener = function(l, u, f, d) {
            var h = n ? n + l : l;
            if (!this._events[h]) return this;
            if (!u) return s(this, h), this;
            var p = this._events[h];
            if (p.fn) p.fn === u && (!d || p.once) && (!f || p.context === f) && s(this, h);
            else {
                for (var m = 0, v = [], b = p.length; m < b; m++)(p[m].fn !== u || d && !p[m].once || f && p[m].context !== f) && v.push(p[m]);
                v.length ? this._events[h] = v.length === 1 ? v[0] : v : s(this, h)
            }
            return this
        }, a.prototype.removeAllListeners = function(l) {
            var u;
            return l ? (u = n ? n + l : l, this._events[u] && s(this, u)) : (this._events = new r, this._eventsCount = 0), this
        }, a.prototype.off = a.prototype.removeListener, a.prototype.addListener = a.prototype.on, a.prefixed = n, a.EventEmitter = a, e.exports = a
    })(Ur)), Ur.exports
}
var py = hy();
const C0 = qt(py);
var $ = Symbol.for("koota.internal"),
    gy = 0;

function T0(e) {
    const t = gy++,
        n = Object.assign(r => {
            const o = r[$];
            let i = o.actionInstances[t];
            return i || (i = e(r), t >= o.actionInstances.length && (o.actionInstances.length = t + 1), o.actionInstances[t] = i), i
        }, {
            initializer: e
        });
    return Object.defineProperty(n, "id", {
        value: t,
        writable: !1,
        enumerable: !0,
        configurable: !1
    }), n
}
var ul = 4,
    fl = 8,
    dl = 20,
    my = (1 << ul) - 1,
    Qe = (1 << fl) - 1,
    z = (1 << dl) - 1,
    Be = dl,
    ge = Be + fl;

function vy(e, t, n) {
    return (e & my) << ge | (t & Qe) << Be | n & z
}
var by = e => e & -267386881 | ((e >>> Be & Qe) + 1 & Qe) << Be,
    Ie = Symbol.for("relationPair"),
    qr = Symbol.for("relation"),
    er = Symbol.for("orderedTargetsTrait");

function yy() {
    return {
        worldCursor: 0,
        releasedWorldIds: [],
        maxWorlds: 2 ** ul
    }
}

function _y(e) {
    if (e.releasedWorldIds.length > 0) return e.releasedWorldIds.pop();
    if (e.worldCursor >= e.maxWorlds) throw new Error(`Koota: Too many worlds created. The maximum is ${e.maxWorlds}.`);
    return e.worldCursor++
}

function xy(e, t) {
    if (t < 0 || t >= e.maxWorlds) throw new Error(`Invalid world ID: ${t}`);
    t === e.worldCursor - 1 ? e.worldCursor-- : t < e.worldCursor && !e.releasedWorldIds.includes(t) && e.releasedWorldIds.push(t)
}
var oe = {
        worlds: [],
        cachedQueries: new Map,
        worldIndex: yy()
    },
    Bn = Symbol("modifier");

function Bs(e) {
    const {
        type: t
    } = e;
    return t.includes("added") || t.includes("removed") || t.includes("changed")
}

function wy(e) {
    const {
        type: t
    } = e;
    return t.includes("added") ? "add" : t.includes("removed") ? "remove" : t.includes("changed") ? "change" : null
}

function Ey(e) {
    return e.type === "or" && Array.isArray(e.modifiers)
}
var $y = 3;

function Sy() {
    return $y
}

function Cy(e, t) {
    const n = e[$],
        r = structuredClone(n.entityMasks);
    n.trackingSnapshots.set(t, r), n.dirtyMasks.set(t, r.map(o => o.map(() => 0))), n.changedMasks.set(t, r.map(o => o.map(() => 0)))
}

function hl(e, t, n) {
    const r = t.staticBitmasks,
        o = t.generations,
        i = e[$],
        s = n & z;
    if (t.traitInstances.all.length === 0) return !1;
    for (let a = 0; a < o.length; a++) {
        const c = o[a],
            l = r[a];
        if (!l) continue;
        const u = l.required,
            f = l.forbidden,
            d = l.or,
            h = i.entityMasks[c] ?.[s] || 0;
        if (!f && !u && !d || f && (h & f) !== 0 || u && (h & u) !== u || d !== 0 && (h & d) === 0) return !1
    }
    return !0
}

function Vt(e, t, n) {
    if (!hl(e, t, n)) return !1;
    if (t.relationFilters && t.relationFilters.length > 0) {
        for (const r of t.relationFilters)
            if (!rr(e, n, r)) return !1
    }
    return !0
}

function pl(e, t, n, r, o, i) {
    const s = t.staticBitmasks,
        a = t.trackingGroups,
        c = t.generations,
        l = t.traitInstances.all,
        u = e[$].entityMasks,
        f = n & z,
        d = c.length,
        h = a.length;
    if (l.length === 0) return !1;
    for (let v = 0; v < d; v++) {
        const b = c[v],
            _ = s[v];
        if (!_) continue;
        const x = _.required,
            w = _.forbidden,
            C = _.or,
            E = u[b],
            S = E ? E[f] | 0 : 0;
        if (w && (S & w) !== 0 || x && (S & x) !== x || C !== 0 && (S & C) === 0) return !1
    }
    let p = !1,
        m = !1;
    for (let v = 0; v < h; v++) {
        const b = a[v],
            _ = b.type,
            x = b.logic,
            w = b.bitmasks,
            C = w[o];
        if (C && C & i) {
            if (r === "remove") {
                if (_ === "add" || _ === "change") return !1
            } else if (r === "add" && (_ === "remove" || _ === "change")) return !1;
            if (_ === r) {
                if (r === "change") {
                    const R = u[o];
                    if (!((R ? R[f] | 0 : 0) & i)) return !1
                }
                const E = b.trackers;
                let S = E[o];
                S || (S = [], E[o] = S), S[f] = S[f] | 0 | i
            }
        }
        if (x === "or") {
            if (p = !0, !m) {
                const E = b.trackers,
                    S = w.length;
                for (let R = 0; R < S; R++) {
                    const j = w[R];
                    if (!j) continue;
                    const T = E[R];
                    if ((T ? T[f] | 0 : 0) & j) {
                        m = !0;
                        break
                    }
                }
            }
        } else {
            const E = b.trackers,
                S = w.length;
            for (let R = 0; R < S; R++) {
                const j = w[R];
                if (!j) continue;
                const T = E[R];
                if (((T ? T[f] | 0 : 0) & j) !== j) return !1
            }
        }
    }
    return !(p && !m)
}

function Ut(e, t, n, r, o, i) {
    if (!pl(e, t, n, r, o, i)) return !1;
    if (t.relationFilters && t.relationFilters.length > 0) {
        for (const s of t.relationFilters)
            if (!rr(e, n, s)) return !1
    }
    return !0
}

function ae(e, t, n) {
    let r;
    const o = e[$];
    if (!Pe(e, t, n)) r = void 0;
    else {
        const s = n.id;
        s < o.traitInstances.length && o.traitInstances[s] !== void 0 || he(e, n);
        const a = o.traitInstances[n.id],
            c = t & z,
            {
                generationId: l,
                bitflag: u
            } = a;
        for (const f of o.changedMasks.values()) f[l] || (f[l] = []), f[l][c] || (f[l][c] = 0), f[l][c] |= u;
        for (const f of a.trackingQueries) {
            if (!f.hasChangedModifiers || !f.changedTraits.has(n)) continue;
            (f.relationFilters && f.relationFilters.length > 0 ? Ut(e, f, t, "change", l, u) : f.checkTracking(e, t, "change", l, u)) ? f.add(t): f.remove(e, t)
        }
        r = a
    }
    const i = r;
    if (i)
        for (const s of i.changeSubscriptions) s(t)
}

function Ty(e, t, n, r) {
    let o;
    const i = e[$];
    if (!Pe(e, t, n)) o = void 0;
    else {
        const a = n.id;
        a < i.traitInstances.length && i.traitInstances[a] !== void 0 || he(e, n);
        const c = i.traitInstances[n.id],
            l = t & z,
            {
                generationId: u,
                bitflag: f
            } = c;
        for (const d of i.changedMasks.values()) d[u] || (d[u] = []), d[u][l] || (d[u][l] = 0), d[u][l] |= f;
        for (const d of c.trackingQueries) {
            if (!d.hasChangedModifiers || !d.changedTraits.has(n)) continue;
            (d.relationFilters && d.relationFilters.length > 0 ? Ut(e, d, t, "change", u, f) : d.checkTracking(e, t, "change", u, f)) ? d.add(t): d.remove(e, t)
        }
        o = c
    }
    const s = o;
    if (s)
        for (const a of s.changeSubscriptions) a(t, r)
}

function Ry(e, t) {
    const n = e[$],
        o = t[er].relation[$].trait,
        i = n.traitInstances[t.id];
    if (!i) return;
    let s = n.traitInstances[o.id];
    s || (he(e, o), s = n.traitInstances[o.id]);
    const {
        generationId: a,
        bitflag: c,
        store: l
    } = i, {
        entityMasks: u,
        entityIndex: f
    } = n, d = t[$], h = p => {
        const m = p & z;
        return u[a] ?.[m] & c ? d.get(m, l) : void 0
    };
    s.addSubscriptions.add((p, m) => {
        h(m) ?._appendWithoutSync(p)
    }), s.removeSubscriptions.add((p, m) => {
        const v = m & z,
            b = f.sparse[v];
        b !== void 0 && (f.dense[b] & z) === v && h(m) ?._removeWithoutSync(p)
    })
}
var Oy = class extends Array {
    world;
    parent;
    relation;
    orderedTrait;
    _syncing = !1;
    constructor(e, t, n, r, o = []) {
        super(...o), this.world = e, this.parent = t, this.relation = n, this.orderedTrait = r
    }
    get[Symbol.toStringTag]() {
        return "OrderedList"
    }
    push(...e) {
        this._syncing = !0;
        try {
            for (const n of e) Ze(this.world, n, this.relation(this.parent));
            const t = super.push(...e);
            return ae(this.world, this.parent, this.orderedTrait), t
        } finally {
            this._syncing = !1
        }
    }
    pop() {
        this._syncing = !0;
        try {
            const e = super.pop();
            return e !== void 0 && (vt(this.world, e, this.relation(this.parent)), ae(this.world, this.parent, this.orderedTrait)), e
        } finally {
            this._syncing = !1
        }
    }
    shift() {
        this._syncing = !0;
        try {
            const e = super.shift();
            return e !== void 0 && (vt(this.world, e, this.relation(this.parent)), ae(this.world, this.parent, this.orderedTrait)), e
        } finally {
            this._syncing = !1
        }
    }
    unshift(...e) {
        this._syncing = !0;
        try {
            for (const n of e) Ze(this.world, n, this.relation(this.parent));
            const t = super.unshift(...e);
            return ae(this.world, this.parent, this.orderedTrait), t
        } finally {
            this._syncing = !1
        }
    }
    splice(e, t, ...n) {
        this._syncing = !0;
        try {
            const r = super.splice(e, t ?? 0, ...n);
            for (const o of r) vt(this.world, o, this.relation(this.parent));
            for (const o of n) Ze(this.world, o, this.relation(this.parent));
            return (r.length > 0 || n.length > 0) && ae(this.world, this.parent, this.orderedTrait), r
        } finally {
            this._syncing = !1
        }
    }
    sort(e) {
        return super.sort(e), ae(this.world, this.parent, this.orderedTrait), this
    }
    reverse() {
        return super.reverse(), ae(this.world, this.parent, this.orderedTrait), this
    }
    map(e) {
        return Array.prototype.map.call(this, e)
    }
    filter(e) {
        return Array.prototype.filter.call(this, e)
    }
    slice(e, t) {
        return Array.prototype.slice.call(this, e, t)
    }
    moveTo(e, t) {
        const n = this.indexOf(e);
        if (n === -1) throw new Error("Item not found in OrderedList");
        n !== t && (super.splice(n, 1), super.splice(t, 0, e), ae(this.world, this.parent, this.orderedTrait))
    }
    insert(e, t) {
        this._syncing = !0;
        try {
            Ze(this.world, e, this.relation(this.parent)), super.splice(t, 0, e), ae(this.world, this.parent, this.orderedTrait)
        } finally {
            this._syncing = !1
        }
    }
    _appendWithoutSync(e) {
        this._syncing || (super.push(e), ae(this.world, this.parent, this.orderedTrait))
    }
    _removeWithoutSync(e) {
        if (!this._syncing) {
            const t = this.indexOf(e);
            t !== -1 && (super.splice(t, 1), ae(this.world, this.parent, this.orderedTrait))
        }
    }
};

function ky(e) {
    if (typeof e == "function") return []; {
        const t = {};
        for (const n in e) t[n] = [];
        return t
    }
}

function Iy(e) {
    const n = Object.keys(e).map(o => `if ('${o}' in value) store.${o}[index] = value.${o};`).join(`
    `);
    return new Function("index", "store", "value", `
		${n}
	  `)
}

function Py(e) {
    const n = Object.keys(e).map(o => `store.${o}[index] = value.${o};`).join(`
    `);
    return new Function("index", "store", "value", `
		${n}
	  `)
}

function Ay(e) {
    const n = Object.keys(e).map(o => `if (store.${o}[index] !== value.${o}) {
            store.${o}[index] = value.${o};
            changed = true;
        }`).join(`
    `);
    return new Function("index", "store", "value", `
        let changed = false;
        ${n}
        return changed;
        `)
}

function Dy(e) {
    const n = `{ ${Object.keys(e).map(o=>`${o}: store.${o}[index]`).join(", ")} }`;
    return new Function("index", "store", `
        return ${n};
        `)
}

function gl(e) {
    return (t, n, r) => {
        n[t] = r
    }
}

function My(e) {
    return (t, n, r) => {
        let o = !1;
        return r !== n[t] && (n[t] = r, o = !0), o
    }
}

function jy(e) {
    return (t, n) => n[t]
}
var Ly = () => {},
    tr = () => Ly,
    Ny = {
        soa: Iy,
        aos: gl,
        tag: tr
    },
    Fy = {
        soa: Py,
        aos: gl,
        tag: tr
    },
    zy = {
        soa: Ay,
        aos: My,
        tag: tr
    },
    Wy = {
        soa: Dy,
        aos: jy,
        tag: tr
    },
    By = Object.freeze({}),
    Hy = 0;

function Vy(e = By) {
    const t = typeof e == "function",
        n = !t && Object.keys(e).length === 0,
        r = t ? "aos" : n ? "tag" : "soa";
    for (const s in e) {
        const a = e[s];
        if (a !== null && typeof a == "object") {
            const c = Array.isArray(a) ? "array" : "object";
            throw new Error(`Koota: ${s} is an ${c}, which is not supported in traits.`)
        }
    }
    const o = Hy++,
        i = Object.assign(s => [i, s], {
            [$]: {
                id: o,
                set: Ny[r](e),
                fastSet: Fy[r](e),
                fastSetWithChangeDetection: zy[r](e),
                get: Wy[r](e),
                createStore: () => ky(e),
                relation: null,
                type: r
            }
        });
    return Object.defineProperty(i, "id", {
        value: o,
        writable: !1,
        enumerable: !0,
        configurable: !1
    }), Object.defineProperty(i, "schema", {
        value: e,
        writable: !1,
        enumerable: !0,
        configurable: !1
    }), i
}
var Uy = Vy;

function he(e, t) {
    const n = e[$],
        r = t[$],
        o = {
            generationId: n.entityMasks.length - 1,
            bitflag: n.bitflag,
            trait: t,
            store: r.createStore(),
            queries: new Set,
            trackingQueries: new Set,
            notQueries: new Set,
            relationQueries: new Set,
            schema: t.schema,
            changeSubscriptions: new Set,
            addSubscriptions: new Set,
            removeSubscriptions: new Set
        },
        i = t.id;
    i >= n.traitInstances.length && (n.traitInstances.length = i + 1), n.traitInstances[i] = o, e.traits.add(t), r.relation && n.relations.add(r.relation);
    const s = e[$];
    s.bitflag *= 2, s.bitflag >= 2 ** 31 && (s.bitflag = 1, s.entityMasks.push([])), er in t && Ry(e, t)
}

function qy(e, t, n) {
    const r = n[er].relation;
    return new Oy(e, t, r, n)
}

function Ze(e, t, ...n) {
    for (let r = 0; r < n.length; r++) {
        const o = n[r];
        if (o ?.[Ie]) {
            const d = o[$],
                h = d.relation,
                p = d.target;
            if (typeof p == "number") {
                const m = d.params,
                    v = h[$],
                    b = v.trait;
                let _;
                const x = e[$],
                    w = h[$],
                    C = w.trait,
                    E = x.traitInstances[C.id];
                if (!E || !E.relationTargets) _ = !1;
                else {
                    const S = t & z;
                    if (w.exclusive) _ = E.relationTargets[S] === p;
                    else {
                        const R = E.relationTargets[S];
                        _ = R ? R.includes(p) : !1
                    }
                }
                if (!_) {
                    if (v.exclusive) {
                        let T;
                        const O = e[$],
                            k = h[$],
                            A = O.traitInstances[k.trait.id];
                        if (!A || !A.relationTargets) T = void 0;
                        else {
                            const N = t & z;
                            k.exclusive ? T = A.relationTargets[N] : T = A.relationTargets[N] ?.[0]
                        }
                        const M = T;
                        if (M !== void 0 && M !== p) {
                            const N = e[$].traitInstances[b.id];
                            if (N)
                                for (const W of N.removeSubscriptions) W(t, M);
                            nr(e, h, t, M)
                        }
                    }
                    let S;
                    if (Pe(e, t, b)) S = void 0;
                    else {
                        const T = e[$],
                            O = b.id;
                        O < T.traitInstances.length && T.traitInstances[O] !== void 0 || he(e, b);
                        const k = T.traitInstances[b.id],
                            {
                                generationId: A,
                                bitflag: M,
                                queries: N,
                                trackingQueries: W
                            } = k,
                            V = t & z;
                        T.entityMasks[A][V] |= M;
                        for (const I of T.dirtyMasks.values()) I[A] || (I[A] = []), I[A][V] |= M;
                        for (const I of N) I.toRemove.remove(t), (I.relationFilters && I.relationFilters.length > 0 ? Vt(e, I, t) : I.check(e, t)) ? I.add(t) : I.remove(e, t);
                        for (const I of W) I.toRemove.remove(t), (I.relationFilters && I.relationFilters.length > 0 ? Ut(e, I, t, "add", A, M) : I.checkTracking(e, t, "add", A, M)) ? I.add(t) : I.remove(e, t);
                        T.entityTraits.get(t).add(b), S = k
                    }
                    let R = S;
                    const j = Gy(e, h, t, p);
                    if (j !== -1) {
                        const T = R ?.schema_6_$f ?? e[$].traitInstances[b.id].schema;
                        let O;
                        if (b[$].type === "aos") O = typeof T == "function" ? T() : null;
                        else if (!T || typeof T == "function" || Object.keys(T).length === 0) O = null;
                        else {
                            const A = {};
                            for (const M in T) typeof T[M] == "function" ? A[M] = T[M]() : A[M] = T[M];
                            O = A
                        }
                        const k = O;
                        k ? xo(e, t, h, j, { ...k,
                            ...m
                        }) : m && xo(e, t, h, j, m), R = R ?? e[$].traitInstances[b.id];
                        for (const A of R.addSubscriptions) A(t, p)
                    }
                }
            }
            continue
        }
        let i, s;
        Array.isArray(o) ? [i, s] = o : i = o;
        let a;
        if (Pe(e, t, i)) a = void 0;
        else {
            const d = e[$],
                h = i.id;
            h < d.traitInstances.length && d.traitInstances[h] !== void 0 || he(e, i);
            const p = d.traitInstances[i.id],
                {
                    generationId: m,
                    bitflag: v,
                    queries: b,
                    trackingQueries: _
                } = p,
                x = t & z;
            d.entityMasks[m][x] |= v;
            for (const w of d.dirtyMasks.values()) w[m] || (w[m] = []), w[m][x] |= v;
            for (const w of b) w.toRemove.remove(t), (w.relationFilters && w.relationFilters.length > 0 ? Vt(e, w, t) : w.check(e, t)) ? w.add(t) : w.remove(e, t);
            for (const w of _) w.toRemove.remove(t), (w.relationFilters && w.relationFilters.length > 0 ? Ut(e, w, t, "add", m, v) : w.checkTracking(e, t, "add", m, v)) ? w.add(t) : w.remove(e, t);
            d.entityTraits.get(t).add(i), a = p
        }
        const c = a;
        if (!c) continue;
        const l = i[$];
        let u;
        if (l.type === "aos") u = typeof c.schema == "function" ? c.schema() : null;
        else if (!c.schema || typeof c.schema == "function" || Object.keys(c.schema).length === 0) u = null;
        else {
            const d = {};
            for (const h in c.schema) typeof c.schema[h] == "function" ? d[h] = c.schema[h]() : d[h] = c.schema[h];
            u = d
        }
        const f = er in i ? qy(e, t, i) : u;
        l.type === "aos" ? Nt(e, t, i, s ?? f, !1) : f ? Nt(e, t, i, { ...f,
            ...s
        }, !1) : s && Nt(e, t, i, s, !1);
        for (const d of c.addSubscriptions) d(t)
    }
}

function vt(e, t, ...n) {
    for (let r = 0; r < n.length; r++) {
        const o = n[r];
        if (o ?.[Ie]) {
            const s = o[$],
                a = s.relation,
                c = s.target,
                l = a[$].trait;
            if (Pe(e, t, l)) {
                const u = e[$].traitInstances[l.id];
                if (c === "*") {
                    if (u) {
                        let f;
                        const d = e[$],
                            h = a[$],
                            p = d.traitInstances[h.trait.id];
                        if (!p || !p.relationTargets) f = [];
                        else {
                            const v = t & z;
                            if (h.exclusive) {
                                const b = p.relationTargets[v];
                                f = b !== void 0 ? [b] : []
                            } else {
                                const b = p.relationTargets[v];
                                f = b !== void 0 ? b.slice() : []
                            }
                        }
                        const m = f;
                        for (const v of m)
                            for (const b of u.removeSubscriptions) b(t, v)
                    }
                    Hs(e, a, t), $n(e, t, l)
                } else if (typeof c == "number") {
                    if (u)
                        for (const h of u.removeSubscriptions) h(t, c);
                    const {
                        removedIndex: f,
                        wasLastTarget: d
                    } = nr(e, a, t, c);
                    f === -1 || d && $n(e, t, l)
                }
            }
            continue
        }
        if (!Pe(e, t, o)) continue;
        const i = o[$];
        if (i.relation) {
            const s = e[$].traitInstances[o.id];
            if (s) {
                let a;
                const c = e[$],
                    l = i.relation[$],
                    u = c.traitInstances[l.trait.id];
                if (!u || !u.relationTargets) a = [];
                else {
                    const d = t & z;
                    if (l.exclusive) {
                        const h = u.relationTargets[d];
                        a = h !== void 0 ? [h] : []
                    } else {
                        const h = u.relationTargets[d];
                        a = h !== void 0 ? h.slice() : []
                    }
                }
                const f = a;
                for (const d of f)
                    for (const h of s.removeSubscriptions) h(t, d)
            }
            Hs(e, i.relation, t)
        }
        $n(e, t, o)
    }
}

function Ky(e, t, n, r) {
    const o = t[$].trait,
        i = e[$].traitInstances[o.id];
    if (i)
        for (const c of i.removeSubscriptions) c(n, r);
    const {
        removedIndex: s,
        wasLastTarget: a
    } = nr(e, t, n, r);
    s !== -1 && a && $n(e, n, o)
}

function Pe(e, t, n) {
    const r = e[$],
        o = r.traitInstances[n.id];
    if (!o) return !1;
    const {
        generationId: i,
        bitflag: s
    } = o, a = t & z;
    return (r.entityMasks[i][a] & s) === s
}

function Nt(e, t, n, r, o = !0) {
    if (n ?.[Ie]) {
        const u = n[$],
            f = u.relation,
            d = u.target;
        typeof d != "number" ? result_setTraitForPair_46_$f = void 0 : (Xy(e, t, f, d, r), o && Ty(e, t, f[$].trait, d));
        return
    }
    const i = n[$],
        c = e[$].traitInstances[n.id].store,
        l = t & z;
    r instanceof Function && (r = r(i.get(l, c))), i.set(l, c, r), o && ae(e, t, n)
}

function ml(e, t, n) {
    if (n ?.[Ie]) {
        let o;
        const i = n[$],
            s = i.relation,
            a = i.target;
        return rr(e, t, n) ? typeof a != "number" ? o = void 0 : o = Jy(e, t, s, a) : o = void 0, o
    }
    let r;
    if (!Pe(e, t, n)) r = void 0;
    else {
        const o = n[$],
            a = e[$].traitInstances[n.id].store;
        r = o.get(t & z, a)
    }
    return r
}

function $n(e, t, n) {
    if (!Pe(e, t, n)) return;
    const r = e[$],
        o = r.traitInstances[n.id],
        {
            generationId: i,
            bitflag: s,
            queries: a,
            trackingQueries: c
        } = o;
    for (const u of o.removeSubscriptions) u(t);
    const l = t & z;
    r.entityMasks[i][l] &= ~s;
    for (const u of r.dirtyMasks.values()) u[i][l] |= s;
    for (const u of a)(u.relationFilters && u.relationFilters.length > 0 ? Vt(e, u, t) : u.check(e, t)) ? u.add(t) : u.remove(e, t);
    for (const u of c)(u.relationFilters && u.relationFilters.length > 0 ? Ut(e, u, t, "remove", i, s) : u.checkTracking(e, t, "remove", i, s)) ? u.add(t) : u.remove(e, t);
    r.entityTraits.get(t).delete(n)
}

function Gy(e, t, n, r) {
    const o = e[$],
        i = t[$],
        s = i.trait,
        a = o.traitInstances[s.id];
    if (!a) return -1;
    a.relationTargets || (a.relationTargets = []);
    const c = n & z;
    let l;
    if (i.exclusive) {
        const u = a.relationTargets;
        if (u[c] === r) return -1;
        u[c] = r, l = 0
    } else {
        const u = a.relationTargets;
        if (u[c] || (u[c] = []), u[c].indexOf(r) !== -1) return -1;
        l = u[c].length, u[c].push(r)
    }
    return vl(e, t, n), l
}

function nr(e, t, n, r) {
    const o = e[$],
        i = t[$],
        s = i.trait,
        a = o.traitInstances[s.id];
    if (!a || !a.relationTargets) return {
        removedIndex: -1,
        wasLastTarget: !1
    };
    const c = n & z;
    let l = -1,
        u = !1;
    if (i.exclusive) {
        const d = a.relationTargets;
        d[c] === r && (d[c] = void 0, l = 0, u = !1, Qy(a.store, s[$].type, c))
    } else {
        const h = a.relationTargets[c];
        if (h) {
            const p = h.indexOf(r);
            if (p !== -1) {
                const m = h.length - 1;
                p !== m && (h[p] = h[m]), h.pop(), Yy(a.store, s[$].type, c, p, m), l = p, u = h.length > 0
            }
        }
    }
    return l !== -1 && vl(e, t, n), {
        removedIndex: l,
        wasLastTarget: l !== -1 && !u
    }
}

function vl(e, t, n) {
    const r = e[$],
        o = t[$].trait,
        i = r.traitInstances[o.id];
    if (i)
        for (const s of i.relationQueries) Vt(e, s, n) ? s.add(n) : s.remove(e, n)
}

function Yy(e, t, n, r, o) {
    if (t === "aos") {
        const i = e[n];
        i && (r !== o && (i[r] = i[o]), i.pop())
    } else
        for (const i in e) {
            const s = e[i][n];
            s && (r !== o && (s[r] = s[o]), s.pop())
        }
}

function Qy(e, t, n, r, o) {
    if (t === "aos") e[n] = void 0;
    else
        for (const i in e) e[i][n] = void 0
}

function Hs(e, t, n) {
    let r;
    const o = e[$],
        i = t[$],
        s = o.traitInstances[i.trait.id];
    if (!s || !s.relationTargets) r = [];
    else {
        const c = n & z;
        if (i.exclusive) {
            const l = s.relationTargets[c];
            r = l !== void 0 ? [l] : []
        } else {
            const l = s.relationTargets[c];
            r = l !== void 0 ? l.slice() : []
        }
    }
    const a = r;
    for (const c of a) nr(e, t, n, c)
}

function bl(e, t, n) {
    const r = e[$],
        o = t[$],
        i = o.trait,
        s = r.traitInstances[i.id];
    if (!s || !s.relationTargets) return [];
    const a = n,
        c = r.entityIndex,
        l = c.sparse,
        u = c.dense,
        f = [],
        d = s.relationTargets;
    for (let h = 0; h < d.length; h++) {
        let p = !1;
        if (o.exclusive) p = d[h] === a;
        else {
            const m = d[h];
            p = m ? m.includes(a) : !1
        }
        if (p) {
            const m = l[h];
            m !== void 0 && (u[m] & z) === h && f.push(u[m])
        }
    }
    return f
}

function xo(e, t, n, r, o) {
    const i = n[$],
        s = i.trait,
        a = e[$].traitInstances[s.id];
    if (!a) return;
    const c = a.store,
        l = t & z;
    if (s[$].type === "aos") {
        i.exclusive ? c[l] = o : (c[l] ??= [])[r] = o;
        return
    }
    if (i.exclusive)
        for (const u in o) c[u][l] = o[u];
    else
        for (const u in o)(c[u][l] ??= [])[r] = o[u]
}

function Xy(e, t, n, r, o) {
    let i;
    const s = e[$],
        a = n[$],
        c = a.trait,
        l = s.traitInstances[c.id];
    if (!l || !l.relationTargets) i = -1;
    else {
        const f = t & z;
        if (a.exclusive) i = l.relationTargets[f] === r ? 0 : -1;
        else {
            const d = l.relationTargets[f];
            i = d ? d.indexOf(r) : -1
        }
    }
    const u = i;
    u !== -1 && xo(e, t, n, u, o)
}

function Jy(e, t, n, r) {
    const o = e[$],
        i = n[$].trait,
        s = o.traitInstances[i.id];
    if (!s) return;
    let a;
    const c = e[$],
        l = n[$],
        u = l.trait,
        f = c.traitInstances[u.id];
    if (!f || !f.relationTargets) a = -1;
    else {
        const b = t & z;
        if (l.exclusive) a = f.relationTargets[b] === r ? 0 : -1;
        else {
            const _ = f.relationTargets[b];
            a = _ ? _.indexOf(r) : -1
        }
    }
    const d = a;
    if (d === -1) return;
    const h = i[$],
        p = s.store,
        m = t & z,
        v = n[$];
    if (h.type === "aos") return v.exclusive ? p[m] : p[m] ?.[d]; {
        const b = {},
            _ = p;
        for (const x in p) v.exclusive ? b[x] = _[x][m] : b[x] = _[x][m] ?.[d];
        return b
    }
}

function rr(e, t, n) {
    const r = n[$],
        o = r.relation,
        i = r.target;
    if (!Pe(e, t, o[$].trait)) return !1;
    if (i === "*") return !0;
    if (typeof i == "number") {
        let s;
        const a = e[$],
            c = o[$],
            l = c.trait,
            u = a.traitInstances[l.id];
        if (!u || !u.relationTargets) s = !1;
        else {
            const f = t & z;
            if (c.exclusive) s = u.relationTargets[f] === i;
            else {
                const d = u.relationTargets[f];
                s = d ? d.includes(i) : !1
            }
        }
        return s
    }
    return !1
}
var Sn = Symbol.for("queryRef"),
    Vs = class {
        #e = [];
        #t = [];
        #n = 0;
        has(e) {
            const t = this.#t[e];
            return t < this.#n && this.#e[t] === e
        }
        add(e) {
            this.has(e) || (this.#t[e] = this.#n, this.#e[this.#n++] = e)
        }
        remove(e) {
            if (!this.has(e)) return;
            const t = this.#t[e];
            this.#n--;
            const n = this.#e[this.#n];
            n !== e && (this.#e[t] = n, this.#t[n] = t)
        }
        clear() {
            for (let e = 0; e < this.#n; e++) this.#t[this.#e[e]] = 0;
            this.#n = 0
        }
        sort() {
            this.#e.sort((e, t) => e - t);
            for (let e = 0; e < this.#e.length; e++) this.#t[this.#e[e]] = e
        }
        getIndex(e) {
            return this.#t[e]
        }
        get dense() {
            return this.#e.slice(0, this.#n)
        }
        get sparse() {
            return this.#t
        }
    };

function Us(e, t) {
    return e === t || typeof e == "object" && e !== null && typeof t == "object" && t !== null && (() => {
        const n = Object.keys(e),
            r = Object.keys(t);
        return n.length === r.length && n.every(o => Object.hasOwn(t, o) && e[o] === t[o])
    })()
}

function Zy(e, t, n, r) {
    const o = [],
        i = [];
    for (let a = 0; a < r.length; a++) {
        const c = r[a];
        if (c ?.[Ie]) {
            const f = c[$].relation[$].trait;
            if (f[$].type !== "tag") {
                o.push(f);
                const h = e[$].traitInstances[f.id];
                i.push(h.store)
            }
            continue
        }
        if (c ?.[Bn]) {
            if (c.type === "not") continue;
            const l = c.traits;
            for (const u of l) {
                if (u[$].type === "tag") continue;
                o.push(u);
                const d = e[$].traitInstances[u.id];
                i.push(d.store)
            }
        } else {
            const l = c;
            if (l[$].type === "tag") continue;
            o.push(l);
            const f = e[$].traitInstances[l.id];
            i.push(f.store)
        }
    }
    const s = Object.assign(t, {
        readEach(a) {
            const c = Array.from({
                length: o.length
            });
            for (let l = 0; l < t.length; l++) {
                const u = t[l],
                    f = u & z;
                for (let d = 0; d < o.length; d++) {
                    const m = o[d][$].get(f, i[d]);
                    c[d] = m
                }
                a(c, u, l)
            }
            return s
        },
        updateEach(a, c = {
            changeDetection: "auto"
        }) {
            const l = Array.from({
                length: o.length
            });
            if (c.changeDetection === "auto") {
                const u = [],
                    f = [],
                    d = [],
                    h = [];
                for (let p = 0; p < o.length; p++) {
                    const m = o[p],
                        v = e[$].trackedTraits.has(m),
                        b = n.hasChangedModifiers && n.changedTraits.has(m);
                    v || b ? d.push(p) : h.push(p)
                }
                for (let p = 0; p < t.length; p++) {
                    const m = t[p],
                        v = m & z;
                    for (let b = 0; b < o.length; b++) {
                        const x = o[b][$],
                            w = x.get(v, i[b]);
                        l[b] = w, f[b] = x.type === "aos" ? { ...w
                        } : null
                    }
                    if (a(l, m, p), !!e.has(m)) {
                        for (let b = 0; b < d.length; b++) {
                            const _ = d[b],
                                x = o[_],
                                w = x[$],
                                C = l[_],
                                E = i[_];
                            let S = !1;
                            w.type === "aos" ? (S = w.fastSetWithChangeDetection(v, E, C), S || (S = !Us(C, f[_]))) : S = w.fastSetWithChangeDetection(v, E, C), S && u.push([m, x])
                        }
                        for (let b = 0; b < h.length; b++) {
                            const _ = h[b],
                                w = o[_][$],
                                C = i[_];
                            w.fastSet(v, C, l[_])
                        }
                    }
                }
                for (let p = 0; p < u.length; p++) {
                    const [m, v] = u[p];
                    ae(e, m, v)
                }
            } else if (c.changeDetection === "always") {
                const u = [],
                    f = [];
                for (let d = 0; d < t.length; d++) {
                    const h = t[d],
                        p = h & z;
                    for (let m = 0; m < o.length; m++) {
                        const b = o[m][$],
                            _ = b.get(p, i[m]);
                        l[m] = _, f[m] = b.type === "aos" ? { ..._
                        } : null
                    }
                    if (a(l, h, d), !!e.has(h))
                        for (let m = 0; m < o.length; m++) {
                            const v = o[m],
                                b = v[$],
                                _ = l[m];
                            let x = !1;
                            b.type === "aos" ? (x = b.fastSetWithChangeDetection(p, i[m], _), x || (x = !Us(_, f[m]))) : x = b.fastSetWithChangeDetection(p, i[m], _), x && u.push([h, v])
                        }
                }
                for (let d = 0; d < u.length; d++) {
                    const [h, p] = u[d];
                    ae(e, h, p)
                }
            } else if (c.changeDetection === "never")
                for (let u = 0; u < t.length; u++) {
                    const f = t[u],
                        d = f & z;
                    for (let h = 0; h < o.length; h++) {
                        const v = o[h][$].get(d, i[h]);
                        l[h] = v
                    }
                    if (a(l, f, u), !!e.has(f))
                        for (let h = 0; h < o.length; h++) o[h][$].fastSet(d, i[h], l[h])
                }
            return s
        },
        useStores(a) {
            return a(i, t), s
        },
        select(...a) {
            o.length = 0, i.length = 0;
            for (let c = 0; c < a.length; c++) {
                const l = a[c];
                if (l ?.[Ie]) {
                    const d = l[$].relation[$].trait;
                    if (d[$].type !== "tag") {
                        o.push(d);
                        const p = e[$].traitInstances[d.id];
                        i.push(p.store)
                    }
                    continue
                }
                if (l ?.[Bn]) {
                    if (l.type === "not") continue;
                    const u = l.traits;
                    for (const f of u) {
                        if (f[$].type === "tag") continue;
                        o.push(f);
                        const h = e[$].traitInstances[f.id];
                        i.push(h.store)
                    }
                } else {
                    const u = l;
                    if (u[$].type === "tag") continue;
                    o.push(u);
                    const d = e[$].traitInstances[u.id];
                    i.push(d.store)
                }
            }
            return s
        },
        sort(a = (c, l) => (c & z) - (l & z)) {
            return Array.prototype.sort.call(t, a), s
        }
    });
    return s
}
var xn = {
    readEach(e) {
        for (let t = 0; t < this.length; t++) e([], this[t], t);
        return this
    },
    updateEach(e) {
        for (let t = 0; t < this.length; t++) e([], this[t], t);
        return this
    },
    useStores(e) {
        return e([], this), this
    },
    select() {
        return this
    }
};

function e0(e) {
    const t = Object.assign(e, {
        readEach: xn.readEach,
        updateEach: xn.updateEach,
        useStores: xn.useStores,
        select: xn.select,
        sort(n = (r, o) => (r & z) - (o & z)) {
            return Array.prototype.sort.call(e, n), t
        }
    });
    return t
}
var Pt = new Float64Array(1024),
    Ft = e => {
        Pt.fill(0);
        let t = 0;
        for (let o = 0; o < e.length; o++) {
            const i = e[o];
            if (i ?.[Ie]) {
                const s = i[$],
                    a = s.relation,
                    c = s.target,
                    l = a[$].trait.id,
                    u = typeof c == "number" ? c : -1;
                Pt[t++] = l * 1e7 + u + 5e6
            } else if (i ?.[Bn]) {
                const s = i.id,
                    a = i.traitIds;
                for (let c = 0; c < a.length; c++) {
                    const l = a[c];
                    Pt[t++] = s * 1e5 + l
                }
            } else {
                const s = i.id;
                Pt[t++] = s
            }
        }
        const n = Pt.subarray(0, t);
        return n.sort(), n.join(",")
    },
    Dt = Uy();

function t0(e, t, n) {
    o0(e);
    const r = t.entities.dense.slice();
    if (t.isTracking) {
        t.entities.clear();
        const o = r.length;
        for (let i = 0; i < o; i++) t.resetTrackingBitmasks(r[i])
    }
    return Zy(e, r, t, n)
}

function n0(e, t) {
    e.toRemove.remove(t), e.entities.add(t);
    for (const n of e.addSubscriptions) n(t);
    e.version++
}

function r0(e, t, n) {
    if (!t.entities.has(n) || t.toRemove.has(n)) return;
    const r = e[$];
    t.toRemove.add(n), r.dirtyQueries.add(t);
    for (const o of t.removeSubscriptions) o(n);
    t.version++
}

function o0(e) {
    const t = e[$];
    if (t.dirtyQueries.size) {
        for (const n of t.dirtyQueries)
            for (let r = n.toRemove.dense.length - 1; r >= 0; r--) {
                const o = n.toRemove.dense[r];
                n.toRemove.remove(o), n.entities.remove(o)
            }
        t.dirtyQueries.clear()
    }
}

function i0(e, t) {
    const n = e.trackingGroups,
        r = n.length;
    for (let o = 0; o < r; o++) {
        const i = n[o].trackers,
            s = i.length;
        for (let a = 0; a < s; a++) {
            const c = i[a];
            c && (c[t] = 0)
        }
    }
}

function qs(e, t, n, r, o, i) {
    const s = wy(n);
    if (!s) return;
    const a = n.id,
        c = `${s}-${a}-${r}`;
    let l = i.get(c);
    l || (l = {
        logic: r,
        type: s,
        id: a,
        bitmasks: [],
        trackers: []
    }, i.set(c, l), t.trackingGroups.push(l));
    for (const u of n.traits) {
        const f = u.id;
        f < o.traitInstances.length && o.traitInstances[f] !== void 0 || he(e, u);
        const d = o.traitInstances[u.id];
        t.traits.push(u), t.traitInstances.all.push(d);
        const h = d.generationId;
        l.bitmasks[h] = (l.bitmasks[h] || 0) | d.bitflag, s === "change" && (t.changedTraits.add(u), t.hasChangedModifiers = !0)
    }
    t.isTracking = !0
}

function dt(e, t) {
    const n = {
            version: 0,
            world: e,
            parameters: t,
            hash: "",
            traits: [],
            traitInstances: {
                required: [],
                forbidden: [],
                or: [],
                all: []
            },
            staticBitmasks: [],
            trackingGroups: [],
            generations: [],
            entities: new Vs,
            isTracking: !1,
            hasChangedModifiers: !1,
            changedTraits: new Set,
            toRemove: new Vs,
            addSubscriptions: new Set,
            removeSubscriptions: new Set,
            relationFilters: [],
            run: (s, a) => t0(s, n, a),
            add: s => n0(n, s),
            remove: (s, a) => r0(s, n, a),
            check: (s, a) => hl(s, n, a),
            checkTracking: (s, a, c, l, u) => pl(s, n, a, c, l, u),
            resetTrackingBitmasks: s => i0(n, s)
        },
        r = e[$],
        o = new Map;
    for (let s = 0; s < t.length; s++) {
        const a = t[s];
        if (a ?.[Ie]) {
            const l = a[$].relation;
            n.relationFilters.push(a);
            const u = l[$].trait,
                f = u.id;
            f < r.traitInstances.length && r.traitInstances[f] !== void 0 || he(e, u), n.traitInstances.required.push(r.traitInstances[u.id]), n.traits.push(u);
            continue
        }
        if (a ?.[Bn]) {
            const c = a.traits;
            for (let l = 0; l < c.length; l++) {
                const u = c[l],
                    f = u.id;
                f < r.traitInstances.length && r.traitInstances[f] !== void 0 || he(e, u)
            }
            if (a.type === "not") n.traitInstances.forbidden.push(...c.map(l => r.traitInstances[l.id]));
            else if (a.type === "or") {
                if (n.traitInstances.or.push(...c.map(l => r.traitInstances[l.id])), Ey(a))
                    for (const l of a.modifiers) Bs(l) && qs(e, n, l, "or", r, o)
            } else Bs(a) && qs(e, n, a, "and", r, o)
        } else {
            const c = a,
                l = c.id;
            l < r.traitInstances.length && r.traitInstances[l] !== void 0 || he(e, c), n.traitInstances.required.push(r.traitInstances[c.id]), n.traits.push(c)
        }
    }
    n.traitInstances.forbidden.push(r.traitInstances[Dt.id]), n.traitInstances.all = [...n.traitInstances.all, ...n.traitInstances.required, ...n.traitInstances.forbidden, ...n.traitInstances.or], n.generations = n.traitInstances.all.map(s => s.generationId).reduce((s, a) => (s.includes(a) || s.push(a), s), []), n.staticBitmasks = n.generations.map(s => {
        const a = n.traitInstances.required.filter(u => u.generationId === s).reduce((u, f) => u | f.bitflag, 0),
            c = n.traitInstances.forbidden.filter(u => u.generationId === s).reduce((u, f) => u | f.bitflag, 0),
            l = n.traitInstances.or.filter(u => u.generationId === s).reduce((u, f) => u | f.bitflag, 0);
        return {
            required: a,
            forbidden: c,
            or: l
        }
    }), n.hash = Ft(t), r.queriesHashMap.set(n.hash, n), n.isTracking ? n.traitInstances.all.forEach(s => {
        s.trackingQueries.add(n)
    }) : n.traitInstances.all.forEach(s => {
        s.queries.add(n)
    }), n.traitInstances.forbidden.length > 0 && r.notQueries.add(n);
    const i = n.relationFilters && n.relationFilters.length > 0;
    if (i)
        for (const s of n.relationFilters) {
            const a = s[$].relation[$].trait,
                c = r.traitInstances[a.id];
            c && c.relationQueries.add(n)
        }
    if (n.trackingGroups.length > 0)
        for (const s of n.trackingGroups) {
            const {
                type: a,
                id: c,
                logic: l,
                bitmasks: u
            } = s, f = r.trackingSnapshots.get(c), d = r.dirtyMasks.get(c), h = r.changedMasks.get(c);
            for (const p of r.entityIndex.dense) {
                if (n.entities.has(p)) continue;
                const m = p & z;
                let v = l === "and";
                for (let b = 0; b < u.length; b++) {
                    const _ = u[b];
                    if (!_) continue;
                    const x = f[b] ?.[m] || 0,
                        w = r.entityMasks[b] ?.[m] || 0;
                    for (let C = 1; C <= _; C <<= 1) {
                        if (!(_ & C)) continue;
                        let E = !1;
                        switch (a) {
                            case "add":
                                E = (x & C) === 0 && (w & C) === C;
                                break;
                            case "remove":
                                E = (x & C) === C && (w & C) === 0 || (x & C) === 0 && (w & C) === 0 && ((d[b] ?.[m] ?? 0) & C) === C;
                                break;
                            case "change":
                                E = ((h[b] ?.[m] ?? 0) & C) === C;
                                break
                        }
                        if (l === "and") {
                            if (!E) {
                                v = !1;
                                break
                            }
                        } else if (E) {
                            v = !0;
                            break
                        }
                    }
                    if (l === "and" && !v || l === "or" && v) break
                }
                v && n.add(p)
            }
        } else {
            const s = r.entityIndex.dense;
            for (let a = 0; a < s.length; a++) {
                const c = s[a];
                (i ? Vt(e, n, c) : n.check(e, c)) && n.add(c)
            }
        }
    return n
}
var s0 = 0;

function a0(...e) {
    const t = Ft(e),
        n = oe.cachedQueries.get(t);
    if (n) return n;
    const r = s0++,
        o = Object.freeze({
            [Sn]: !0,
            id: r,
            hash: t,
            parameters: e
        });
    return oe.cachedQueries.set(t, o), o
}
var Ks = e => ({
        aliveCount: 0,
        dense: [],
        sparse: [],
        maxId: 0,
        worldId: e
    }),
    c0 = e => {
        if (e.aliveCount < e.dense.length) {
            const r = by(e.dense[e.aliveCount]);
            return e.dense[e.aliveCount] = r, e.sparse[r & z] = e.aliveCount, e.aliveCount++, r
        }
        const t = e.maxId++,
            n = vy(e.worldId, 0, t);
        return e.dense.push(n), e.sparse[t] = e.aliveCount, e.aliveCount++, n
    },
    l0 = (e, t) => {
        const n = t & z,
            r = e.sparse[n];
        if (r === void 0 || r >= e.aliveCount) return;
        const o = e.aliveCount - 1,
            i = e.dense[o],
            s = i & z;
        e.sparse[s] = r, e.dense[r] = i, e.sparse[n] = o, e.dense[o] = t, e.aliveCount--
    },
    u0 = e => e.dense.slice(0, e.aliveCount);
Number.prototype.add = function(...e) {
    const t = this >>> ge;
    return Ze(oe.worlds[t], this, ...e)
};
Number.prototype.remove = function(...e) {
    const t = this >>> ge;
    return vt(oe.worlds[t], this, ...e)
};
Number.prototype.has = function(e) {
    const t = this >>> ge,
        n = oe.worlds[t];
    if (e ?.[Ie]) return rr(n, this, e);
    let r;
    const o = n[$],
        i = o.traitInstances[e.id];
    if (!i) r = !1;
    else {
        const {
            generationId: s,
            bitflag: a
        } = i, c = this & z;
        r = (o.entityMasks[s][c] & a) === a
    }
    return r
};
Number.prototype.destroy = function() {
    const e = this >>> ge;
    return wo(oe.worlds[e], this)
};
Number.prototype.changed = function(e) {
    const t = this >>> ge;
    return ae(oe.worlds[t], this, e)
};
Number.prototype.get = function(e) {
    const t = this >>> ge;
    return ml(oe.worlds[t], this, e)
};
Number.prototype.set = function(e, t, n = !0) {
    const r = this >>> ge;
    Nt(oe.worlds[r], this, e, t, n)
};
Number.prototype.targetsFor = function(e) {
    let t;
    const n = this >>> ge,
        r = oe.worlds[n][$],
        o = e[$],
        i = r.traitInstances[o.trait.id];
    if (!i || !i.relationTargets) t = [];
    else {
        const s = this & z;
        if (o.exclusive) {
            const a = i.relationTargets[s];
            t = a !== void 0 ? [a] : []
        } else {
            const a = i.relationTargets[s];
            t = a !== void 0 ? a.slice() : []
        }
    }
    return t
};
Number.prototype.targetFor = function(e) {
    let t;
    const n = this >>> ge,
        r = oe.worlds[n][$],
        o = e[$],
        i = r.traitInstances[o.trait.id];
    if (!i || !i.relationTargets) t = void 0;
    else {
        const s = this & z;
        o.exclusive ? t = i.relationTargets[s] : t = i.relationTargets[s] ?.[0]
    }
    return t
};
Number.prototype.id = function() {
    return this & z
};
Number.prototype.generation = function() {
    return this >>> Be & Qe
};
Number.prototype.isAlive = function() {
    const e = this >>> ge,
        n = oe.worlds[e][$].entityIndex;
    let r;
    const o = n.sparse[this & z];
    if (o === void 0 || o >= n.aliveCount) r = !1;
    else {
        const i = n.dense[o];
        r = (this >>> Be & Qe) === (i >>> Be & Qe) && this >>> ge === n.worldId
    }
    return r
};

function Kr(e, ...t) {
    const n = e[$],
        r = c0(n.entityIndex);
    for (const o of n.notQueries) o.check(e, r) && o.add(r), o.resetTrackingBitmasks(r & z);
    return n.entityTraits.set(r, new Set), Ze(e, r, ...t), r
}
var f0 = new Set,
    d0 = [];

function wo(e, t) {
    const n = e[$];
    if (!e.has(t)) throw new Error("Koota: The entity being destroyed does not exist.");
    const r = d0,
        o = f0;
    for (r.length = 0, r.push(t), o.clear(); r.length > 0;) {
        const i = r.pop();
        if (o.has(i)) continue;
        o.add(i);
        for (const l of n.relations) {
            const u = l[$],
                f = bl(e, l, i);
            for (const d of f) e.has(d) && (Ky(e, l, d, i), u.autoDestroy === "source" && r.push(d));
            if (u.autoDestroy === "target") {
                let d;
                const h = e[$],
                    p = l[$],
                    m = h.traitInstances[p.trait.id];
                if (!m || !m.relationTargets) d = [];
                else {
                    const b = i & z;
                    if (p.exclusive) {
                        const _ = m.relationTargets[b];
                        d = _ !== void 0 ? [_] : []
                    } else {
                        const _ = m.relationTargets[b];
                        d = _ !== void 0 ? _.slice() : []
                    }
                }
                const v = d;
                for (const b of v) e.has(b) && (o.has(b) || r.push(b))
            }
        }
        const s = n.entityTraits.get(i);
        if (s)
            for (const l of s) vt(e, i, l);
        l0(n.entityIndex, i);
        const a = n.queriesHashMap.get("");
        a && a.remove(e, i), n.entityTraits.delete(i);
        const c = i & z;
        for (let l = 0; l < n.entityMasks.length; l++) n.entityMasks[l][c] = 0
    }
}

function R0(e, ...t) {
    const n = _y(oe.worldIndex);
    let r = !1,
        o;
    const i = {
        [$]: {
            entityIndex: Ks(n),
            entityMasks: [
                []
            ],
            entityTraits: new Map,
            bitflag: 1,
            traitInstances: [],
            relations: new Set,
            queriesHashMap: new Map,
            queryInstances: [],
            actionInstances: [],
            notQueries: new Set,
            dirtyQueries: new Set,
            dirtyMasks: new Map,
            trackingSnapshots: new Map,
            changedMasks: new Map,
            worldEntity: null,
            trackedTraits: new Set,
            resetSubscriptions: new Set
        },
        traits: new Set,
        init(...s) {
            const a = i[$];
            if (r) return;
            r = !0, oe.worlds[n] = i;
            const c = Sy();
            for (let u = 0; u < c; u++) Cy(i, u);
            const l = Dt.id;
            l < a.traitInstances.length && a.traitInstances[l] !== void 0 || he(i, Dt), o && (s = o, o = void 0), a.worldEntity = Kr(i, Dt, ...s)
        },
        spawn(...s) {
            return Kr(i, ...s)
        },
        has(s) {
            let a;
            const c = i[$].entityIndex.sparse[s & z];
            if (c === void 0 || c >= i[$].entityIndex.aliveCount) a = !1;
            else {
                const l = i[$].entityIndex.dense[c];
                a = (s >>> Be & Qe) === (l >>> Be & Qe) && s >>> ge === i[$].entityIndex.worldId
            }
            return typeof s == "number" ? a : Pe(i, i[$].worldEntity, s)
        },
        add(...s) {
            Ze(i, i[$].worldEntity, ...s)
        },
        remove(...s) {
            vt(i, i[$].worldEntity, ...s)
        },
        get(s) {
            return ml(i, i[$].worldEntity, s)
        },
        set(s, a) {
            Nt(i, i[$].worldEntity, s, a, !0)
        },
        destroy() {
            wo(i, i[$].worldEntity), i[$].worldEntity = null, i.reset(), r = !1, xy(oe.worldIndex, n), oe.worlds[n] = null
        },
        reset() {
            o = void 0;
            const s = i[$];
            i.entities.forEach(a => {
                i.has(a) && wo(i, a)
            }), s.entityIndex = Ks(n), s.entityTraits.clear(), s.entityMasks = [
                []
            ], s.bitflag = 1, s.traitInstances.length = 0, i.traits.clear(), s.relations.clear(), s.queriesHashMap.clear(), s.queryInstances.length = 0, s.actionInstances.length = 0, s.dirtyQueries.clear(), s.notQueries.clear(), s.trackingSnapshots.clear(), s.dirtyMasks.clear(), s.changedMasks.clear(), s.trackedTraits.clear(), s.worldEntity = Kr(i, Dt);
            for (const a of s.resetSubscriptions) a(i)
        },
        query(...s) {
            const a = i[$];
            if (s.length === 1 && s[0] ?.[Sn]) {
                const c = s[0];
                let l = a.queryInstances[c.id];
                return l || (l = a.queriesHashMap.get(c.hash), l || (l = dt(i, c.parameters), a.queriesHashMap.set(c.hash, l), c.id >= a.queryInstances.length && (a.queryInstances.length = c.id + 1), a.queryInstances[c.id] = l)), l.run(i, c.parameters)
            } else {
                const c = s;
                if (c.length === 1 && c[0] ?.[Ie]) {
                    const f = c[0][$],
                        d = f.relation,
                        h = f.target;
                    if (typeof h == "number") {
                        const p = bl(i, d, h);
                        return e0(p.slice())
                    }
                }
                const l = Ft(c);
                let u = a.queriesHashMap.get(l);
                return u || (u = dt(i, c), a.queriesHashMap.set(l, u)), u.run(i, c)
            }
        },
        queryFirst(...s) {
            return i.query(...s)[0]
        },
        onQueryAdd(s, a) {
            const c = i[$];
            let l;
            if (s ?.[Sn]) {
                const u = s;
                l = c.queryInstances[u.id] || c.queriesHashMap.get(u.hash), l || (l = dt(i, u.parameters), c.queriesHashMap.set(u.hash, l), u.id >= c.queryInstances.length && (c.queryInstances.length = u.id + 1), c.queryInstances[u.id] = l)
            } else {
                const u = Ft(s);
                l = c.queriesHashMap.get(u), l || (l = dt(i, s), c.queriesHashMap.set(u, l))
            }
            return l.addSubscriptions.add(a), () => l.addSubscriptions.delete(a)
        },
        onQueryRemove(s, a) {
            const c = i[$];
            let l;
            if (s ?.[Sn]) {
                const u = s;
                l = c.queryInstances[u.id] || c.queriesHashMap.get(u.hash), l || (l = dt(i, u.parameters), c.queriesHashMap.set(u.hash, l), u.id >= c.queryInstances.length && (c.queryInstances.length = u.id + 1), c.queryInstances[u.id] = l)
            } else {
                const u = Ft(s);
                l = c.queriesHashMap.get(u), l || (l = dt(i, s), c.queriesHashMap.set(u, l))
            }
            return l.removeSubscriptions.add(a), () => l.removeSubscriptions.delete(a)
        },
        onAdd(s, a) {
            const c = i[$],
                l = s ?.[qr] ? s[$].trait : s;
            let u = c.traitInstances[l.id];
            return u || (he(i, l), u = c.traitInstances[l.id]), u.addSubscriptions.add(a), () => u.addSubscriptions.delete(a)
        },
        onRemove(s, a) {
            const c = i[$],
                l = s ?.[qr] ? s[$].trait : s;
            let u = c.traitInstances[l.id];
            return u || (he(i, l), u = c.traitInstances[l.id]), u.removeSubscriptions.add(a), () => u.removeSubscriptions.delete(a)
        },
        onChange(s, a) {
            const c = i[$],
                l = s ?.[qr] ? s[$].trait : s,
                u = l.id;
            u < c.traitInstances.length && c.traitInstances[u] !== void 0 || he(i, l);
            const f = c.traitInstances[l.id];
            return f.changeSubscriptions.add(a), c.trackedTraits.add(l), () => {
                f.changeSubscriptions.delete(a), f.changeSubscriptions.size === 0 && c.trackedTraits.delete(l)
            }
        }
    };
    return Object.defineProperty(i, "id", {
        get: () => n,
        enumerable: !0
    }), Object.defineProperty(i, "isInitialized", {
        get: () => r,
        enumerable: !0
    }), Object.defineProperty(i, "entities", {
        get: () => u0(i[$].entityIndex),
        enumerable: !0
    }), i.init(...t), i
}
var yl = g.createContext(null);

function _l() {
    const e = g.useContext(yl);
    if (!e) throw new Error("Koota: useWorld must be used within a WorldProvider");
    return e
}

function O0(e) {
    const t = _l();
    return e(t)
}

function k0(...e) {
    const t = _l(),
        [, n] = g.useReducer(a => a + 1, 0),
        r = g.useMemo(() => a0(...e), e),
        o = g.useRef(null),
        s = (() => {
            const a = t[$].queriesHashMap.get(r.hash);
            if (a && o.current ?.hash === r.hash && o.current.version === a.version) return o.current.result;
            const c = t.query(r).sort(),
                l = t[$].queriesHashMap.get(r.hash);
            return o.current = {
                hash: r.hash,
                version: l.version,
                result: c
            }, c
        })();
    return g.useEffect(() => {
        const a = () => n();
        let c = () => {},
            l = () => {};
        const u = () => {
                c = t.onQueryAdd(r, a), l = t.onQueryRemove(r, a);
                const d = t[$].queriesHashMap.get(r.hash);
                o.current && d.version !== o.current.version && a()
            },
            f = () => {
                o.current = null, c(), l(), u(), a()
            };
        return u(), t[$].resetSubscriptions.add(f), () => {
            t[$].resetSubscriptions.delete(f), c(), l()
        }
    }, [t, r]), s
}

function I0({
    children: e,
    world: t
}) {
    return H.jsx(yl.Provider, {
        value: t,
        children: e
    })
}
const Gs = e => Symbol.iterator in e,
    Ys = e => "entries" in e,
    Qs = (e, t) => {
        const n = e instanceof Map ? e : new Map(e.entries()),
            r = t instanceof Map ? t : new Map(t.entries());
        if (n.size !== r.size) return !1;
        for (const [o, i] of n)
            if (!r.has(o) || !Object.is(i, r.get(o))) return !1;
        return !0
    },
    h0 = (e, t) => {
        const n = e[Symbol.iterator](),
            r = t[Symbol.iterator]();
        let o = n.next(),
            i = r.next();
        for (; !o.done && !i.done;) {
            if (!Object.is(o.value, i.value)) return !1;
            o = n.next(), i = r.next()
        }
        return !!o.done && !!i.done
    };

function p0(e, t) {
    return Object.is(e, t) ? !0 : typeof e != "object" || e === null || typeof t != "object" || t === null || Object.getPrototypeOf(e) !== Object.getPrototypeOf(t) ? !1 : Gs(e) && Gs(t) ? Ys(e) && Ys(t) ? Qs(e, t) : h0(e, t) : Qs({
        entries: () => Object.entries(e)
    }, {
        entries: () => Object.entries(t)
    })
}

function P0(e) {
    const t = y.useRef(void 0);
    return n => {
        const r = e(n);
        return p0(t.current, r) ? t.current : t.current = r
    }
}
var Gr = {
        exports: {}
    },
    Xs;

function A0() {
    return Xs || (Xs = 1, (function(e) {
        var t = Object.prototype.hasOwnProperty,
            n = "~";

        function r() {}
        Object.create && (r.prototype = Object.create(null), new r().__proto__ || (n = !1));

        function o(c, l, u) {
            this.fn = c, this.context = l, this.once = u || !1
        }

        function i(c, l, u, f, d) {
            if (typeof u != "function") throw new TypeError("The listener must be a function");
            var h = new o(u, f || c, d),
                p = n ? n + l : l;
            return c._events[p] ? c._events[p].fn ? c._events[p] = [c._events[p], h] : c._events[p].push(h) : (c._events[p] = h, c._eventsCount++), c
        }

        function s(c, l) {
            --c._eventsCount === 0 ? c._events = new r : delete c._events[l]
        }

        function a() {
            this._events = new r, this._eventsCount = 0
        }
        a.prototype.eventNames = function() {
            var l = [],
                u, f;
            if (this._eventsCount === 0) return l;
            for (f in u = this._events) t.call(u, f) && l.push(n ? f.slice(1) : f);
            return Object.getOwnPropertySymbols ? l.concat(Object.getOwnPropertySymbols(u)) : l
        }, a.prototype.listeners = function(l) {
            var u = n ? n + l : l,
                f = this._events[u];
            if (!f) return [];
            if (f.fn) return [f.fn];
            for (var d = 0, h = f.length, p = new Array(h); d < h; d++) p[d] = f[d].fn;
            return p
        }, a.prototype.listenerCount = function(l) {
            var u = n ? n + l : l,
                f = this._events[u];
            return f ? f.fn ? 1 : f.length : 0
        }, a.prototype.emit = function(l, u, f, d, h, p) {
            var m = n ? n + l : l;
            if (!this._events[m]) return !1;
            var v = this._events[m],
                b = arguments.length,
                _, x;
            if (v.fn) {
                switch (v.once && this.removeListener(l, v.fn, void 0, !0), b) {
                    case 1:
                        return v.fn.call(v.context), !0;
                    case 2:
                        return v.fn.call(v.context, u), !0;
                    case 3:
                        return v.fn.call(v.context, u, f), !0;
                    case 4:
                        return v.fn.call(v.context, u, f, d), !0;
                    case 5:
                        return v.fn.call(v.context, u, f, d, h), !0;
                    case 6:
                        return v.fn.call(v.context, u, f, d, h, p), !0
                }
                for (x = 1, _ = new Array(b - 1); x < b; x++) _[x - 1] = arguments[x];
                v.fn.apply(v.context, _)
            } else {
                var w = v.length,
                    C;
                for (x = 0; x < w; x++) switch (v[x].once && this.removeListener(l, v[x].fn, void 0, !0), b) {
                    case 1:
                        v[x].fn.call(v[x].context);
                        break;
                    case 2:
                        v[x].fn.call(v[x].context, u);
                        break;
                    case 3:
                        v[x].fn.call(v[x].context, u, f);
                        break;
                    case 4:
                        v[x].fn.call(v[x].context, u, f, d);
                        break;
                    default:
                        if (!_)
                            for (C = 1, _ = new Array(b - 1); C < b; C++) _[C - 1] = arguments[C];
                        v[x].fn.apply(v[x].context, _)
                }
            }
            return !0
        }, a.prototype.on = function(l, u, f) {
            return i(this, l, u, f, !1)
        }, a.prototype.once = function(l, u, f) {
            return i(this, l, u, f, !0)
        }, a.prototype.removeListener = function(l, u, f, d) {
            var h = n ? n + l : l;
            if (!this._events[h]) return this;
            if (!u) return s(this, h), this;
            var p = this._events[h];
            if (p.fn) p.fn === u && (!d || p.once) && (!f || p.context === f) && s(this, h);
            else {
                for (var m = 0, v = [], b = p.length; m < b; m++)(p[m].fn !== u || d && !p[m].once || f && p[m].context !== f) && v.push(p[m]);
                v.length ? this._events[h] = v.length === 1 ? v[0] : v : s(this, h)
            }
            return this
        }, a.prototype.removeAllListeners = function(l) {
            var u;
            return l ? (u = n ? n + l : l, this._events[u] && s(this, u)) : (this._events = new r, this._eventsCount = 0), this
        }, a.prototype.off = a.prototype.removeListener, a.prototype.addListener = a.prototype.on, a.prefixed = n, a.EventEmitter = a, e.exports = a
    })(Gr)), Gr.exports
}
export {
    C0 as E, qb as L, I0 as W, b0 as a, S0 as b, w0 as c, E0 as d, x0 as e, pb as f, _l as g, P0 as h, _0 as i, T0 as j, k0 as k, O0 as l, R0 as m, A0 as n, $0 as p, rm as r, Uy as t, ey as u
};