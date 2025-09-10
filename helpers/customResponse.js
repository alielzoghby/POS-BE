class CustomResponse {
  constructor(status = 200, message = "Success", data = null) {
    this.status = status;
    this.message = message;
    this.data = data;
  }
  send(res) {
    return res.status(this.status).json({
      status: this.status,
      message: this.message,
      data: this.data
    });
  }

  // Method to get response object without sending
  toObject() {
    return {
      status: this.status,
      message: this.message,
      data: this.data
    };
  }
}

export default CustomResponse;
// export { CustomResponse };
  
