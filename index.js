const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const Promise = require("bluebird");
Promise.promisifyAll(fs);

const baseUrl = "https://www.nvshens.com";

//下载所有图片
async function downloadImage() {
  await getImageTags();
}

// 获取所有的标签
async function getImageTags() {
  const tags = [];
  try {
    let res = await axios.get(`${baseUrl}/gallery/`);
    let $ = cheerio.load(res.data);
    $(".tag_div").each((index, item) => {
      $(item)
        .find("a")
        .each((subIndex, subItem) => {
          tags.push($(subItem).attr("href"));
        });
    });
  } catch (error) {
    console.log(error);
  }
  getImagePages(tags);
}

/**
 * 根据标签获取所有的图片页面
 * @param {*} tags
 */
async function getImagePages(tags) {
  const pages = [];
  try {
    for (let key in tags) {
      let res = await axios.get(`${baseUrl}${tags[key]}`);
      let $ = cheerio.load(res.data);
      $(".pagesYY a").each((index, item) => {
        pages.push($(item).attr("href"));
      });
    }
  } catch (error) {
    console.log(error);
  }
  getImageUrls(pages);
}

/**
 * 根据所有的页面获取所有的图片url
 * @param {*} pages
 */
async function getImageUrls(pages) {
  const imgUrls = [];
  try {
    for (let key in pages) {
      let res = await axios.get(`${baseUrl}${pages[key]}`);
      let $ = cheerio.load(res.data);
      $("#listdiv .galleryli").each((index, item) => {
        let $item = $(item);
        let url = $(item)
          .find("img")
          .data("original");
        if (imgUrls.indexOf(url) < 0) {
          imgUrls.push($item.find("img").data("original"));
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
  saveImage(imgUrls);
}
/**
 * 根据所有的url将图片下载至本地
 * @param {*} imgs
 */
async function saveImage(imgUrls) {
  try {
    await fs.mkdirAsync(path.resolve(__dirname, "./img/"));
  } catch (error) {
    console.log(error);
  }
  for (let key in imgUrls) {
    axios({
      method: "get",
      url: imgUrls[key],
      responseType: "stream"
    })
      .then(res => {
        res.data.pipe(fs.createWriteStream("./img/" + key + ".jpg"));
      })
      .catch(err => console.log(err));
  }
}

downloadImage();
