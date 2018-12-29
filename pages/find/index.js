// pages/find/index.js
const app = getApp();
let http = require('../../utils/http.js');
let authLogin = require('../../utils/authLogin');
Page({
    
    /**
     * 页面的初始数据
     */
    data: {
        motto: '古诗文小助手',
        user_id: 0,
        current_page:1,
        total_page:0,
        tags: ['科普','故事','问与答'],
        pins: null,
        indicatorDots: true,
        animationData:{},
        userInfo: wx.getStorageSync('user'),
        topic: null
    },
    // 获取用户id
    getUserId: function () {
        let user = wx.getStorageSync('user');
        if (user && user.user_id) {
            let user_id = user ? user.user_id : 0;
            this.setData({
                user_id: user_id
            });
        }
    },
    // 新增
    addNew: function (event) {
        let pin_id = event.currentTarget.dataset.id ? event.currentTarget.dataset.id : 0;
        let that = this;
        // 判断用户是否登录
        if (that.data.user_id < 1) {
            authLogin.authLogin('/pages/find/index','tab',app);
        } else {
            let _url = '/pages/find/new/index';
            if(pin_id>0){
                _url = _url +'?type=pin&id='+pin_id;
            }
            wx.navigateTo({
                url: _url
            })
        }
    },
    // 删除
    deletePin: function(e){
        // console.log(e);
        let that = this;
        let id = e.target.dataset.id;
        let url = 'https://xuegushi.cn/wxxcx/pin/' + id + '/update';
        let data = {
            user_id: that.data.user_id,
            wx_token: wx.getStorageSync('wx_token')
        };
        // 判断用户是否登录
        if (that.data.user_id < 1) {
            authLogin.authLogin('/pages/find/index','tab',app);
        } else {
            http.request(url,data).then(res=>{
                if(res.data && res.succeeded){
                    let pins = that.data.pins;
                    pins = pins.filter((item)=>{
                        return item.id != id;
                    });
                    wx.showToast({
                        title: '删除成功',
                        icon: 'success',
                        mask: true,
                        duration: 2000
                    });
                    that.setData({
                        pins: pins
                    })
                }else{
                    console.log(res);
                    wx.showToast({
                        title: '删除失败',
                        icon: 'none',
                        duration: 2000
                    })
                }
            });
        }
    },
    // 详情页
    pinDetail: (e)=>{
        let id = e.currentTarget.dataset.id;
        let type = e.currentTarget.dataset.type;
        wx.navigateTo({
            url: '/pages/find/detail/index?id='+id+'&type='+type
        });
    },
    // 用户 pins 列表页
    userPins: (e)=>{
        let id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: '/pages/find/user/index?id=' + id
        });
    },
    // 鼓掌
    pinLike: function(e){
        let id = e.currentTarget.dataset.id;
        let user_id = wx.getStorageSync('user') ? wx.getStorageSync('user').user_id : 0;
        let wx_token = wx.getStorageSync('wx_token');
        let pins = this.data.pins;
        let that = this;
        let url = app.globalData.url+'/wxxcx/pin/'+id+'/like';
        if (that.data.user_id < 1) {
            authLogin.authLogin('/pages/find/index','tab',app);
        } else {
            http.request(url,{
                user_id:user_id,
                wx_token:wx_token
            }).then(res=>{
                if(res.data && res.succeeded){
                    if(res.data && res.data.status=='active'){
                        pins.map((item, index) => {
                            if (item.id == id) {
                                item.like_count = item.like_count + 1;
                                item.like_status = res.data.status;
                                return item;
                            } else {
                                return item;
                            }
                        });
                        that.setData({
                            pins: pins
                        })
                    }else if(res.data.status =='delete'){
                        pins.map((item, index) => {
                            if (item.id == id) {
                                item.like_count = item.like_count - 1;
                                item.like_status = res.data.status;
                                return item;
                            } else {
                                return item;
                            }
                        });
                        that.setData({
                            pins: pins
                        })
                    }else{
                        http.loadFailL(res.data.msg);
                    }
                }else{
                    http.loadFailL();
                }
            });
        }
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let that = this;
        that.getUserId();
        wx.showLoading({
            title: '加载中',
        });
        let url = app.globalData.url+'/wxxcx/getRecentTopic';
        http.request(url,undefined).then(res=>{
            if(res.data && res.succeeded){
                that.setData({
                    topic: res.data
                });
                that.getPins();
                wx.hideLoading();
            }else{
                http.loadFailL();
            }
        });
    },
    getPins: function(){
        let that = this;
        let user_id = wx.getStorageSync('user') ? wx.getStorageSync('user').user_id : 0;
        wx.showNavigationBarLoading();
        http.request(app.globalData.url+'/wxxcx/getPins?id='+user_id,undefined).then(res=>{
           if(res.data && res.succeeded){
               that.setData({
                   pins: res.data.data,
                   current_page: res.data.current_page,
                   total_page: res.data.last_page
               });
               wx.hideNavigationBarLoading();
           }else{
              http.loadFailL();
           }
        });
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
    
    },
    
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        wx.setNavigationBarTitle({
            title: '广场'
        });
        let animation = wx.createAnimation({
            transformOrigin: "50% 50%",
            duration: 500,
            timingFunction: "ease",
            delay: 0
        });
        animation.scale(1.3,1.3).step();
        this.setData({
            animationData: animation.export()
        });
        setTimeout(function () {
            animation.scale(1,1).step();
            this.setData({
                animationData: animation.export()
            })
        }.bind(this), 500)
    },
    
    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
    
    },
    
    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
    
    },
    
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        this.getPins();
        wx.stopPullDownRefresh();
    },
    
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        if(this.data.last_page<this.data.current_page){
            return false;
        }
        wx.showNavigationBarLoading();
        let that = this;
        // Do something when page reach bottom.
        let data = {
            page: that.data.current_page+1
        };
        let url = app.globalData.url+'/wxxcx/getPins';
        http.request(url,data).then(res=>{
            if(res.data && res.succeeded){
                this.setData({
                    pins: that.data.pins.concat(res.data.data),
                    current_page: res.data.current_page,
                    last_page: res.data.last_page
                });
                wx.hideNavigationBarLoading();
            }else{
                http.loadFailL();
            }
        })
    },
    
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        return {
            title: '发现',
            path: '/pages/find/index',
            // imageUrl:'/images/poem.png',
            success: function(res) {
                // 转发成功
                console.log('转发成功！')
            },
            fail: function(res) {
                // 转发失败
            }
        }
    }
});