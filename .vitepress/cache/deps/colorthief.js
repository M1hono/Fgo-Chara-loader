import "./chunk-7D4SUZUM.js";

// node_modules/colorthief/dist/color-thief.mjs
var t = function(t2, r2) {
  return t2 < r2 ? -1 : t2 > r2 ? 1 : 0;
};
var r = function(t2) {
  return t2.reduce(function(t3, r2) {
    return t3 + r2;
  }, 0);
};
var n = function() {
  function t2(t3) {
    this.colors = t3;
  }
  var r2 = t2.prototype;
  return r2.palette = function() {
    return this.colors;
  }, r2.map = function(t3) {
    return t3;
  }, t2;
}();
var o = function() {
  function o2(t2, r2, n2) {
    return (t2 << 10) + (r2 << 5) + n2;
  }
  function e2(t2) {
    var r2 = [], n2 = false;
    function o3() {
      r2.sort(t2), n2 = true;
    }
    return { push: function(t3) {
      r2.push(t3), n2 = false;
    }, peek: function(t3) {
      return n2 || o3(), void 0 === t3 && (t3 = r2.length - 1), r2[t3];
    }, pop: function() {
      return n2 || o3(), r2.pop();
    }, size: function() {
      return r2.length;
    }, map: function(t3) {
      return r2.map(t3);
    }, debug: function() {
      return n2 || o3(), r2;
    } };
  }
  function i2(t2, r2, n2, o3, e3, i3, u3) {
    var a2 = this;
    a2.r1 = t2, a2.r2 = r2, a2.g1 = n2, a2.g2 = o3, a2.b1 = e3, a2.b2 = i3, a2.histo = u3;
  }
  function u2() {
    this.vboxes = new e2(function(r2, n2) {
      return t(r2.vbox.count() * r2.vbox.volume(), n2.vbox.count() * n2.vbox.volume());
    });
  }
  function a(t2, r2) {
    if (r2.count()) {
      var n2 = r2.r2 - r2.r1 + 1, e3 = r2.g2 - r2.g1 + 1, i3 = Math.max.apply(null, [n2, e3, r2.b2 - r2.b1 + 1]);
      if (1 == r2.count()) return [r2.copy()];
      var u3, a2, c, f, s = 0, h = [], v = [];
      if (i3 == n2) for (u3 = r2.r1; u3 <= r2.r2; u3++) {
        for (f = 0, a2 = r2.g1; a2 <= r2.g2; a2++) for (c = r2.b1; c <= r2.b2; c++) f += t2[o2(u3, a2, c)] || 0;
        h[u3] = s += f;
      }
      else if (i3 == e3) for (u3 = r2.g1; u3 <= r2.g2; u3++) {
        for (f = 0, a2 = r2.r1; a2 <= r2.r2; a2++) for (c = r2.b1; c <= r2.b2; c++) f += t2[o2(a2, u3, c)] || 0;
        h[u3] = s += f;
      }
      else for (u3 = r2.b1; u3 <= r2.b2; u3++) {
        for (f = 0, a2 = r2.r1; a2 <= r2.r2; a2++) for (c = r2.g1; c <= r2.g2; c++) f += t2[o2(a2, c, u3)] || 0;
        h[u3] = s += f;
      }
      return h.forEach(function(t3, r3) {
        v[r3] = s - t3;
      }), function(t3) {
        var n3, o3, e4, i4, a3, c2 = t3 + "1", f2 = t3 + "2", l = 0;
        for (u3 = r2[c2]; u3 <= r2[f2]; u3++) if (h[u3] > s / 2) {
          for (e4 = r2.copy(), i4 = r2.copy(), a3 = (n3 = u3 - r2[c2]) <= (o3 = r2[f2] - u3) ? Math.min(r2[f2] - 1, ~~(u3 + o3 / 2)) : Math.max(r2[c2], ~~(u3 - 1 - n3 / 2)); !h[a3]; ) a3++;
          for (l = v[a3]; !l && h[a3 - 1]; ) l = v[--a3];
          return e4[f2] = a3, i4[c2] = e4[f2] + 1, [e4, i4];
        }
      }(i3 == n2 ? "r" : i3 == e3 ? "g" : "b");
    }
  }
  return i2.prototype = { volume: function(t2) {
    var r2 = this;
    return r2._volume && !t2 || (r2._volume = (r2.r2 - r2.r1 + 1) * (r2.g2 - r2.g1 + 1) * (r2.b2 - r2.b1 + 1)), r2._volume;
  }, count: function(t2) {
    var r2 = this, n2 = r2.histo;
    if (!r2._count_set || t2) {
      var e3, i3, u3, a2 = 0;
      for (e3 = r2.r1; e3 <= r2.r2; e3++) for (i3 = r2.g1; i3 <= r2.g2; i3++) for (u3 = r2.b1; u3 <= r2.b2; u3++) a2 += n2[o2(e3, i3, u3)] || 0;
      r2._count = a2, r2._count_set = true;
    }
    return r2._count;
  }, copy: function() {
    var t2 = this;
    return new i2(t2.r1, t2.r2, t2.g1, t2.g2, t2.b1, t2.b2, t2.histo);
  }, avg: function(t2) {
    var r2 = this, n2 = r2.histo;
    if (!r2._avg || t2) {
      var e3, i3, u3, a2, c = 0, f = 0, s = 0, h = 0;
      if (r2.r1 === r2.r2 && r2.g1 === r2.g2 && r2.b1 === r2.b2) r2._avg = [r2.r1 << 3, r2.g1 << 3, r2.b1 << 3];
      else {
        for (i3 = r2.r1; i3 <= r2.r2; i3++) for (u3 = r2.g1; u3 <= r2.g2; u3++) for (a2 = r2.b1; a2 <= r2.b2; a2++) c += e3 = n2[o2(i3, u3, a2)] || 0, f += e3 * (i3 + 0.5) * 8, s += e3 * (u3 + 0.5) * 8, h += e3 * (a2 + 0.5) * 8;
        r2._avg = c ? [~~(f / c), ~~(s / c), ~~(h / c)] : [~~(8 * (r2.r1 + r2.r2 + 1) / 2), ~~(8 * (r2.g1 + r2.g2 + 1) / 2), ~~(8 * (r2.b1 + r2.b2 + 1) / 2)];
      }
    }
    return r2._avg;
  }, contains: function(t2) {
    var r2 = this, n2 = t2[0] >> 3;
    return gval = t2[1] >> 3, bval = t2[2] >> 3, n2 >= r2.r1 && n2 <= r2.r2 && gval >= r2.g1 && gval <= r2.g2 && bval >= r2.b1 && bval <= r2.b2;
  } }, u2.prototype = { push: function(t2) {
    this.vboxes.push({ vbox: t2, color: t2.avg() });
  }, palette: function() {
    return this.vboxes.map(function(t2) {
      return t2.color;
    });
  }, size: function() {
    return this.vboxes.size();
  }, map: function(t2) {
    for (var r2 = this.vboxes, n2 = 0; n2 < r2.size(); n2++) if (r2.peek(n2).vbox.contains(t2)) return r2.peek(n2).color;
    return this.nearest(t2);
  }, nearest: function(t2) {
    for (var r2, n2, o3, e3 = this.vboxes, i3 = 0; i3 < e3.size(); i3++) ((n2 = Math.sqrt(Math.pow(t2[0] - e3.peek(i3).color[0], 2) + Math.pow(t2[1] - e3.peek(i3).color[1], 2) + Math.pow(t2[2] - e3.peek(i3).color[2], 2))) < r2 || void 0 === r2) && (r2 = n2, o3 = e3.peek(i3).color);
    return o3;
  }, forcebw: function() {
    var n2 = this.vboxes;
    n2.sort(function(n3, o4) {
      return t(r(n3.color), r(o4.color));
    });
    var o3 = n2[0].color;
    o3[0] < 5 && o3[1] < 5 && o3[2] < 5 && (n2[0].color = [0, 0, 0]);
    var e3 = n2.length - 1, i3 = n2[e3].color;
    i3[0] > 251 && i3[1] > 251 && i3[2] > 251 && (n2[e3].color = [255, 255, 255]);
  } }, { quantize: function(r2, c) {
    if (!Number.isInteger(c) || c < 1 || c > 256) throw new Error("Invalid maximum color count. It must be an integer between 1 and 256.");
    if (!r2.length || c < 2 || c > 256) return false;
    if (!r2.length || c < 2 || c > 256) return false;
    for (var f = [], s = /* @__PURE__ */ new Set(), h = 0; h < r2.length; h++) {
      var v = r2[h], l = v.join(",");
      s.has(l) || (s.add(l), f.push(v));
    }
    if (f.length <= c) return new n(f);
    var g = function(t2) {
      var r3, n2 = new Array(32768);
      return t2.forEach(function(t3) {
        r3 = o2(t3[0] >> 3, t3[1] >> 3, t3[2] >> 3), n2[r3] = (n2[r3] || 0) + 1;
      }), n2;
    }(r2);
    g.forEach(function() {
    });
    var p = function(t2, r3) {
      var n2, o3, e3, u3 = 1e6, a2 = 0, c2 = 1e6, f2 = 0, s2 = 1e6, h2 = 0;
      return t2.forEach(function(t3) {
        (n2 = t3[0] >> 3) < u3 ? u3 = n2 : n2 > a2 && (a2 = n2), (o3 = t3[1] >> 3) < c2 ? c2 = o3 : o3 > f2 && (f2 = o3), (e3 = t3[2] >> 3) < s2 ? s2 = e3 : e3 > h2 && (h2 = e3);
      }), new i2(u3, a2, c2, f2, s2, h2, r3);
    }(r2, g), b = new e2(function(r3, n2) {
      return t(r3.count(), n2.count());
    });
    function m(t2, r3) {
      for (var n2, o3 = t2.size(), e3 = 0; e3 < 1e3; ) {
        if (o3 >= r3) return;
        if (e3++ > 1e3) return;
        if ((n2 = t2.pop()).count()) {
          var i3 = a(g, n2), u3 = i3[0], c2 = i3[1];
          if (!u3) return;
          t2.push(u3), c2 && (t2.push(c2), o3++);
        } else t2.push(n2), e3++;
      }
    }
    b.push(p), m(b, 0.75 * c);
    for (var d = new e2(function(r3, n2) {
      return t(r3.count() * r3.volume(), n2.count() * n2.volume());
    }); b.size(); ) d.push(b.pop());
    m(d, c);
    for (var w = new u2(); d.size(); ) w.push(d.pop());
    return w;
  } };
}().quantize;
var e = function(t2) {
  this.canvas = document.createElement("canvas"), this.context = this.canvas.getContext("2d"), this.width = this.canvas.width = t2.naturalWidth, this.height = this.canvas.height = t2.naturalHeight, this.context.drawImage(t2, 0, 0, this.width, this.height);
};
e.prototype.getImageData = function() {
  return this.context.getImageData(0, 0, this.width, this.height);
};
var u = function() {
};
u.prototype.getColor = function(t2, r2) {
  return void 0 === r2 && (r2 = 10), this.getPalette(t2, 5, r2)[0];
}, u.prototype.getPalette = function(t2, r2, n2) {
  var i2 = function(t3) {
    var r3 = t3.colorCount, n3 = t3.quality;
    if (void 0 !== r3 && Number.isInteger(r3)) {
      if (1 === r3) throw new Error("colorCount should be between 2 and 20. To get one color, call getColor() instead of getPalette()");
      r3 = Math.max(r3, 2), r3 = Math.min(r3, 20);
    } else r3 = 10;
    return (void 0 === n3 || !Number.isInteger(n3) || n3 < 1) && (n3 = 10), { colorCount: r3, quality: n3 };
  }({ colorCount: r2, quality: n2 }), u2 = new e(t2), a = function(t3, r3, n3) {
    for (var o2, e2, i3, u3, a2, c2 = t3, f = [], s = 0; s < r3; s += n3) e2 = c2[0 + (o2 = 4 * s)], i3 = c2[o2 + 1], u3 = c2[o2 + 2], (void 0 === (a2 = c2[o2 + 3]) || a2 >= 125) && (e2 > 250 && i3 > 250 && u3 > 250 || f.push([e2, i3, u3]));
    return f;
  }(u2.getImageData().data, u2.width * u2.height, i2.quality), c = o(a, i2.colorCount);
  return c ? c.palette() : null;
}, u.prototype.getColorFromUrl = function(t2, r2, n2) {
  var o2 = this, e2 = document.createElement("img");
  e2.addEventListener("load", function() {
    var i2 = o2.getPalette(e2, 5, n2);
    r2(i2[0], t2);
  }), e2.src = t2;
}, u.prototype.getImageData = function(t2, r2) {
  var n2 = new XMLHttpRequest();
  n2.open("GET", t2, true), n2.responseType = "arraybuffer", n2.onload = function() {
    if (200 == this.status) {
      var t3 = new Uint8Array(this.response);
      i = t3.length;
      for (var n3 = new Array(i), o2 = 0; o2 < t3.length; o2++) n3[o2] = String.fromCharCode(t3[o2]);
      var e2 = n3.join(""), u2 = window.btoa(e2);
      r2("data:image/png;base64," + u2);
    }
  }, n2.send();
}, u.prototype.getColorAsync = function(t2, r2, n2) {
  var o2 = this;
  this.getImageData(t2, function(t3) {
    var e2 = document.createElement("img");
    e2.addEventListener("load", function() {
      var t4 = o2.getPalette(e2, 5, n2);
      r2(t4[0], this);
    }), e2.src = t3;
  });
};
export {
  u as default
};
//# sourceMappingURL=colorthief.js.map
