// pages/find/detail/index.js
const app = getApp();
let http = require('../../../utils/http.js');
let authLogin = require('../../../utils/authLogin');
Page({
    /**
     * 页面的初始数据
     */
    data: {
        location: {
            name: '添加地点',
        },
        location_img: '/images/icon/location_fill.png',
        type: null,
        poem: null,
        poet: null,
        pin: null,
        p_pin:null,
        t_id: 0,
        user_id: 0,
        content: '',
        review_bottom: 0,
        review_count:0,
        review_users: null,
        show_load: true,
        reviews: [],
        current_page: 0,
        total: 1
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
        if (that.data.user_id < 1) {
            authLogin.authLogin('/pages/find/detail/index?id='+pin_id,'nor',app);
        } else {
            let _url = '/pages/find/new/index';
            if (pin_id > 0) {
                _url = _url + '?type=pin&id=' + pin_id;
            }
            wx.navigateTo({
                url: _url
            })
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
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let that = this;
        this.getUserId();
        console.log(options.id, options.type);
        wx.setNavigationBarTitle({
            title: '详情'
        });
        let url = app.globalData.url+'/wxxcx/getPinDetail/' + options.id;
        let data = {
          user_id: that.data.user_id
        };
        http.request(url,data).then(res=>{
            if(res.data && res.succeeded){
                console.log('----------success------------');
                this.setData({
                    pin: res.data.pin,
                    poem: res.data.poem ? res.data.poem : null,
                    poet: res.data.poet ? res.data.poet : null,
                    type: 'pin',
                    t_id: res.data.pin.id
                });
                // wx.hideLoading();
                that.getPinReviews();
            }else{
                http.loadFailL();
            }
        });
    },
    // 评论获取焦点
    reviewFocus: function(){
        // console.log(event.detail)
        this.setData({
            review_bottom: '10px'
        })
    },
    // 键盘收起
    keyBoardDown: function(){
        this.setData({
            review_bottom: 0
        })
    },
    // 评论发布
    reviewSend: function(){
        let that = this;
        if (that.data.user_id < 1) {
            authLogin.authLogin('/pages/find/detail/index?id='+that.data.pin.id,'nor',app);
        } else {
            if(that.data.content ==''){
                wx.showModal({
                    title: '提示',
                    content: '内容不能为空哦',
                    success: function (res) {
                        if (res.confirm) {
                            console.log('---');
                            return false;
                        } else if (res.cancel) {
                            console.log('用户点击取消')
                        }
                    }
                });
                return false;
            }
            let data = {
                wx_token: wx.getStorageSync('wx_token'),
                user_id: that.data.user_id,
                content: that.data.content,
                t_id: that.data.pin.id,
                t_type: 'pin'
            };
    
            http.request(app.globalData.url+'/wxxcx/createPinReview',data).then(res=>{
                if(res.data && res.succeeded){
                    if (res.data.status == 200) {
                        let review = res.data.review;
                        let reviews = that.data.reviews.concat(review);
                        let review_count = that.data.review_count+1;
                        that.setData({
                            reviews: reviews,
                            show_load: false,
                            content: '',
                            review_count: review_count
                        })
                    }else{
                        http.loadFailL();
                    }
                }else{
                    http.loadFailL();
                }
            });
        }
    },
    // 跳转到用户页
    userPins: (e) => {
        let id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: '/pages/find/user/index?id=' + id
        });
    },
    // 获取评论
    getPinReviews: function(){
        let that = this;
        let id = that.data.pin.id;
        let page = that.data.current_page +1;
        if(that.data.total<page){
            console.log(page,that.data.total);
            return false;
        }
        that.setData({
            show_load: true
        });
        http.request(app.globalData.url+'/wxxcx/getPinReviews/'+id,{page:page}).then(res=>{
           if(res.data && res.succeeded){
               that.setData({
                   reviews: page == 1 ? res.data.reviews.data : that.data.reviews.concat(res.data.reviews.data),
                   current_page: res.data.reviews.current_page,
                   total: res.data.reviews.last_page ? res.data.reviews.last_page : 1,
                   show_load: false,
                   review_count: res.data.reviews.total,
                   review_users: res.data.users.data
               })
           } else{
               http.loadFailL()
           }
        });
    },
    // 输入检测
    bindKeyInput: function (e) {
        this.setData({
            content: e.detail.value
        })
    },
    // 跳转到点赞用户列表页
    pinLikeUsers: function (e) {
        let that = this;
        let id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: '/pages/find/users/index?id='+id
        })
    },
    // 删除评论
    deleteReview: function(e){
        let that =this;
        let id = e.currentTarget.dataset.id;
        let t_id = e.currentTarget.dataset.pinId;
        if (that.data.user_id < 1) {
            authLogin.authLogin('/pages/find/detail/index?id='+id,'nor',app);
        } else {
            let url = app.globalData.url+'/wxxcx/deletePinReview/';
            let data ={
                id: id,
                user_id: wx.getStorageSync('user').user_id,
                wx_tiken: wx.getStorageSync('wx_token')
            };
            http.request(url,data).then(res=>{
               if(res.data && res.succeeded){
                   if (res.data.status==200) {
                       wx.showToast({
                           title: '删除成功',
                           icon: 'success',
                           duration: 1000
                       });
                       setTimeout(() => {
                           let reviews = that.data.reviews;
                           reviews = reviews.filter(item=>{
                               return item.id != id;
                           });
                           that.setData({
                               reviews: reviews
                           });
                       }, 1000)
                   } else if (res.data.status== 500) {
                       http.loadFailL(res.data.msg);
                   }
               } else{
                   http.loadFailL();
               }
            });
        }
    },
    // 点赞
    pinLike: function (e) {
        let id = e.currentTarget.dataset.id;
        let user_id = wx.getStorageSync('user') ? wx.getStorageSync('user').user_id : 0;
        let wx_token = wx.getStorageSync('wx_token');
        let pin = this.data.pin;
        let that = this;
        if (that.data.user_id < 1) {
            authLogin.authLogin('/pages/find/detail/index?id='+id,'nor',app);
        } else {
            http.request(app.globalData.url+'wxxcx/pin/' + id + '/like',{
                user_id: user_id,
                wx_token: wx_token
            }).then(res=>{
                if(res.data && res.succeeded){
                    if (res.data.status == 'active') {
                        pin.like_count = pin.like_count + 1;
                        pin.like_status = 'active';
                        that.setData({
                            pin: pin
                        })
                    } else if (res.data.status == 'delete') {
                        pin.like_count = pin.like_count - 1;
                        pin.like_status = 'delete';
                        that.setData({
                            pin: pin
                        })
                    } else {
                        http.loadFailL(res.data.msg);
                    }
                }else{
                    http.loadFailL();
                }
            });
        }
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
        this.setData({
            current_page: 0,
            reviews: [],
            total:1
        });
        this.getPinReviews();
        wx.stopPullDownRefresh();
    },
    
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        this.getPinReviews();
    },
    
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        return {
            title: this.data.pin.content,
            path: '/pages/find/detail/index?id=' + this.data.pin.id,
            // imageUrl:'/images/poem.png',
            success: function (res) {
                // 转发成功
                console.log('转发成功！')
            },
            fail: function (res) {
                // 转发失败
            }
        }
    }
});