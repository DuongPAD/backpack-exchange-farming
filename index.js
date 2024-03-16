"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backpack_client_1 = require("./backpack_client");
require('dotenv').config();

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

function getNowFormatDate() {
    var date = new Date();
    var separatorType1 = "-";
    var separatorType2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    var strHour = date.getHours();
    var strMinute = date.getMinutes();
    var strSecond = date.getSeconds();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    if (strHour >= 0 && strHour <= 9) {
        strHour = "0" + strHour;
    }
    if (strMinute >= 0 && strMinute <= 9) {
        strMinute = "0" + strMinute;
    }
    if (strSecond >= 0 && strSecond <= 9) {
        strSecond = "0" + strSecond;
    }
    var currentDate = date.getFullYear() + separatorType1 + month + separatorType2 + strDate
        + " " + strHour + separatorType2 + strMinute
        + separatorType2 + strSecond;
    return currentDate;
}

let successBuy = 0;
let successSell = 0;

const init = async (client) => {
    try {
        console.log(`Số lần mua thành công:${successBuy}, Số lần bán thành công:${successSell}`);
        console.log(getNowFormatDate(), "Đang lấy thông tin tài khoản...");
        let userBalance = await client.Balance();
        let randomNumber = Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000;
        await sleep(randomNumber);
        // Kiểm tra số dư USDC trong tài khoản có lớn hơn 5 không
        console.log('userBalance', userBalance);

        if (userBalance && userBalance.USDC && userBalance.USDC.available > 5) {
            await buyOrder(client);
        } else {
            await sellOrder(client);
            return;
        }
    } catch (e) {
        init(client);
        console.log(getNowFormatDate(), "Đặt hàng thất bại, đang thử lại...");
        let randomSleepNumber = Math.floor(Math.random() * (200000 - 60000 + 1)) + 60000;
        await sleep(randomSleepNumber);
    }
}


const sellOrder = async (client) => {
    // Hủy tất cả các đơn đặt hàng chưa hoàn thành
    let GetOpenOrders = await client.GetOpenOrders({ symbol: "SOL_USDC" });
    if (GetOpenOrders.length > 0) {
        await client.CancelOpenOrders({ symbol: "SOL_USDC" });
        console.log(getNowFormatDate(), "Hủy tất cả các đơn đặt hàng");
    } else {
        console.log(getNowFormatDate(), "Đơn đặt hàng tài khoản bình thường, không cần hủy đơn đặt hàng");
    }
    console.log(getNowFormatDate(), "Đang lấy thông tin tài khoản...");
    // Lấy thông tin tài khoản
    let userBalance2 = await client.Balance();
    console.log(getNowFormatDate(), "Thông tin tài khoản:", userBalance2);
    console.log(getNowFormatDate(), "Đang lấy giá thị trường hiện tại của sol_usdc...");
    // Lấy giá hiện tại
    let { lastPrice: currentPrice } = await client.Ticker({ symbol: "SOL_USDC" });
    console.log(getNowFormatDate(), "Giá thị trường hiện tại của sol_usdc:", currentPrice);
    let amount = ((userBalance2.SOL.available) - 0.05).toFixed(2).toString();
    console.log(getNowFormatDate(), `Đang bán... Bán ${amount} SOL`);
    let orderResultAsk = await client.ExecuteOrder({
        orderType: "Limit",
        price: currentPrice.toString(),
        quantity: amount,
        side: "Ask", // Bán
        symbol: "SOL_USDC",
        timeInForce: "IOC"
    })

    if (orderResultAsk?.status == "Filled" && orderResultAsk?.side == "Ask") {
        console.log(getNowFormatDate(), "Bán thành công");
        successSell += 1;
        console.log(getNowFormatDate(), "Chi tiết đơn hàng:", `Giá bán:${orderResultAsk.price}, Số lượng bán:${orderResultAsk.quantity}, Mã đơn hàng:${orderResultAsk.id}`);
        let randomNumber = Math.floor(Math.random() * (300000 - 60000 + 1)) + 60000;
        console.log('Sleep', `${randomNumber}ms`);
        await sleep(randomNumber);
        init(client);
    } else {
        console.log(getNowFormatDate(), "Bán thất bại");
        throw new Error("Bán thất bại");
    }
}
const buyOrder = async (client) => {
    // Hủy tất cả các đơn đặt hàng chưa hoàn thành
    let GetOpenOrders = await client.GetOpenOrders({ symbol: "SOL_USDC" });
    if (GetOpenOrders.length > 0) {
        await client.CancelOpenOrders({ symbol: "SOL_USDC" });
        console.log(getNowFormatDate(), "Hủy tất cả các đơn đặt hàng");
    } else {
        console.log(getNowFormatDate(), "Tài khoản đặt hàng bình thường, không cần hủy đơn đặt hàng");
    }
    console.log(getNowFormatDate(), "Đang lấy thông tin tài khoản...");
    // Lấy thông tin tài khoản
    let userBalance = await client.Balance();
    console.log(getNowFormatDate(), "Thông tin tài khoản:", userBalance);
    console.log(getNowFormatDate(), "Đang lấy giá thị trường hiện tại của sol_usdc...");
    // Lấy giá hiện tại
    let { lastPrice } = await client.Ticker({ symbol: "SOL_USDC" });
    console.log(getNowFormatDate(), "Giá thị trường hiện tại của sol_usdc:", lastPrice);
    console.log(getNowFormatDate(), `Đang mua... Sử dụng ${(userBalance.USDC.available - 2).toFixed(2).toString()} USDC để mua SOL`);
    let amount = ((userBalance.USDC.available - 2) / lastPrice).toFixed(2).toString();
    console.log("USDC amount: ", amount);
    let orderResultBid = await client.ExecuteOrder({
        orderType: "Limit",
        price: lastPrice.toString(),
        quantity: amount,
        side: "Bid", // Mua
        symbol: "SOL_USDC",
        timeInForce: "IOC"
    })
    if (orderResultBid?.status == "Filled" && orderResultBid?.side == "Bid") {
        console.log(getNowFormatDate(), "Đặt hàng thành công");
        successBuy += 1;
        console.log(getNowFormatDate(), "Chi tiết đơn hàng:", `Giá mua:${orderResultBid.price}, Số lượng mua:${orderResultBid.quantity}, Mã đơn hàng:${orderResultBid.id}`);
        let randomNumber = Math.floor(Math.random() * (300000 - 60000 + 1)) + 60000;
        console.log('Sleep', `${randomNumber}ms`);
        await sleep(randomNumber);
        init(client);
    } else {
        console.log(getNowFormatDate(), "Đặt hàng thất bại");
        throw new Error("Mua thất bại");
    }
}

(async () => {
    // Thay bằng apisecret và apikey của anh em
    const secretKey = process.env.SECRET_KEY;
    const apiKey = process.env.APIKEY;
    const client = new backpack_client_1.BackpackClient(secretKey, apiKey);
    init(client);
})()
