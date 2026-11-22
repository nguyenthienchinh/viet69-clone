import * as cheerio from "cheerio";
import fs from "node:fs";
import { execSync } from "node:child_process";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36";
const b64 = (s) => Buffer.from(s, "base64").toString("utf8");
const parseCount = (s) => { if(!s) return 0; const m=String(s).trim().match(/([\d.,]+)\s*([KMB]?)/i); if(!m) return 0; let n=parseFloat(m[1].replace(/,/g,"")); if(isNaN(n))return 0; const suf=(m[2]||"").toUpperCase(); if(suf==="K")n*=1e3; else if(suf==="M")n*=1e6; else if(suf==="B")n*=1e9; return Math.round(n); };

function parse(html, url, isMember) {
  const $ = cheerio.load(html);
  const slug = url.split("/").filter(Boolean).pop();
  const title = ($('meta[property="og:title"]').attr("content")||"").replace(/ - Viet69$/i,"").replace(/ - +$/,"").trim();
  const description = ($('meta[property="og:description"]').attr("content")||$('meta[name="description"]').attr("content")||"").replace(/\s+/g," ").trim();
  let thumbnail = ($('meta[property="og:image"]').attr("content")||"").trim();
  if (!thumbnail) thumbnail = $('img[src*="vscd.net/images"]').first().attr("src") || $('img').first().attr("src") || "";
  thumbnail = thumbnail.replace(/class=large/g,"width=500");

  // servers
  let embedKind, serverUuids = [], serverUrl = "";
  const ml = $('.movieLoader').attr("data-movie");
  if (ml) {
    embedKind = "emb";
    serverUuids.push(b64(ml)); // server 1
    const dvs = $('.movieLoader-server .video2-btn').map((_,e)=>$(e).attr("data-video")).get().filter(Boolean);
    if (dvs.length >= 2) serverUuids.push(b64(dvs[1])); // server 2
  } else {
    // old: direct iframe in entry-content
    const ic = $('.entry-content iframe').first().attr("src");
    const anyIframe = $('iframe').first().attr("src");
    const dsrc = $('video[data-src]').attr("data-src");
    if (dsrc) { embedKind = "member"; serverUrl = url; }
    else if (ic || anyIframe) { embedKind = "direct"; serverUrl = ic || anyIframe; }
    else { embedKind = "member"; serverUrl = url; }
  }

  // stats anchor: sau player
  let anchor = html.indexOf('movieLoader" data-movie');
  if (anchor < 0) { const p = html.indexOf("<iframe"); anchor = p >= 0 ? p : 0; }
  const frag = cheerio.load(html.slice(anchor, anchor + 7000));
  let views = parseCount(frag(".views .count").first().text() || "0");
  let comments = parseInt((frag(".comments .count").first().text()||"0").replace(/[^\d]/g,""))||0;
  let likes = parseInt((frag(".video-action__like-count").first().text()||"").replace(/[^\d]/g,""))||0;
  if (!likes) { frag("[data-pid]").each((_,el)=>{ if(!likes){const t=parseInt((frag(el).text()||"").replace(/[^\d]/g,"")); if(t)likes=t;} }); }

  // author (tên user)
  const main = $('div.post.type-post').not(".item-video").first();
  const em = main.find(".entry-meta").first();
  let authorName = (em.find('a[rel="author"]').first().text() || $('a[rel="author"]').first().text() || "").trim();
  if (!authorName && isMember) { const m = html.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/); authorName = m?m[1]:"Thành viên"; }
  if (!authorName) authorName = "admin";
  const authorHref = (em.find('a[rel="author"]').first().attr("href")||"");
  const authorUser = (authorHref.match(/author\/([^/]+)\//)?.[1]) || authorName.toLowerCase().replace(/[^a-z0-9]+/g,"").slice(0,30) || "admin";

  // date
  let date = "";
  const onM = em.text().match(/on\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (onM) date = `${onM[3]}-${onM[2].padStart(2,"0")}-${onM[1].padStart(2,"0")}T00:00:00+00:00`;

  // category + tags
  const classes = (main.attr("class")||"").split(/\s+/).filter(Boolean);
  const catSlug = classes.find(c=>c.startsWith("category-"))?.replace("category-","")||"";
  const tags = classes.filter(c=>c.startsWith("tag-")).map(c=>c.replace("tag-",""));

  return { slug, title, embedKind, serverUuids, serverUrl, views, likes, comments, authorName, authorUser, date, catSlug, tags:tags.length, thumb: thumbnail.slice(0,50) };
}

const urls = [
  ["https://viet69.be/co-giao-kinh-can-bu-cu-loc-xoay-phe-qua-xuat-tinh-den-2-lan-moi-biet-la-quen-deo-bao/", false, "NEW"],
  ["https://viet69.be/dap-em-rau-dam-toi-ben-trong-nha-nghi/", false, "OLD"],
];
for (const [u, member, label] of urls) {
  const html = execSync(`curl -s -A "${UA}" "${u}"`).toString();
  const r = parse(html, u, member);
  console.log("=== " + label + " ===");
  console.log(JSON.stringify(r, null, 1));
}
