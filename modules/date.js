module.exports = (client) => {
  //<Month Date>.getMonthText() returns the month name instead of just the month number
  Date.prototype.getMonthText = function(date) {
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[this.getMonth()];
  }
};