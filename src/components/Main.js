import React, {Component} from 'react';
import moment from 'moment';
// These are currently hard-coded for developing the front end
import {ASSETS, BUDGET_ITEMS, DEBTS, INCOME_SOURCES} from '../constants/dummy_data.js';

class Main extends Component {

  // Difference between two days in days
  dateDiff = (startDate, endDate) => {
    return Math.floor((endDate - startDate)/(24*60*60*1000))
  }

  calculateAccruedInterest = (principal, interestRate, startDate, endDate) => {
    const daysInYear = 365;
    const interestRateFactor = interestRate / daysInYear;
    return this.dateDiff(startDate, endDate) * principal *   interestRateFactor
  }

  getNthDayOfMonth = (date, n) => {
    return new Date(date.getUTCFullYear(), date.getMonth(), n);
  };

  getNthDayOfNextMonth = (date, n) => {
    let nextMonth = date.getMonth() + 1
    let year = date.getUTCFullYear()

    if (nextMonth === 12) {
      nextMonth = 0
      ++year
    }
    return new Date(year, nextMonth, n);
  };

  // Compute remaining interest payments
  computeRemainingLoanPayments = (principal, interestRate, monthlyPayment, paymentDayOfMonth) => {
    let today = new Date()
    let startDate = this.getNthDayOfMonth(today, paymentDayOfMonth)
    let balance = principal
    let amountPaid = 0
    let totalInterest = 0
    let loanPayments = []
    // while the currentBalance is greater than 0
    while (balance > 0) {
    // Calculate interest before next payment date
      let paymentDate = this.getNthDayOfNextMonth(startDate, paymentDayOfMonth)
      let thisMonthsInterest = this.calculateAccruedInterest(
        balance, interestRate, startDate, paymentDate
      );
      if (balance + thisMonthsInterest < monthlyPayment){
        monthlyPayment = balance + thisMonthsInterest
      };

      balance = balance + thisMonthsInterest - monthlyPayment

      totalInterest = totalInterest + thisMonthsInterest
      amountPaid = amountPaid + monthlyPayment

      loanPayments.push(
        {paymentDate: paymentDate, paymentAmount: monthlyPayment, accruedInterest: thisMonthsInterest, balance: balance}
      )
      startDate = paymentDate
    }
    console.log("total interest to be paid", totalInterest)
    console.log("Payments remaining to pay off loan", loanPayments.length)
    return loanPayments
  }

  reducer = (accumulator, budgetItem) => accumulator + budgetItem

  // Formats the output of a number to US dollars
  formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  computeMonthlyBudget = () => {
    let monthlyBudgetItemAmounts = BUDGET_ITEMS
      .filter(budgetItem => budgetItem.frequency === "monthly")
      .map(budgetItem => budgetItem.amount)
    return monthlyBudgetItemAmounts.reduce(this.reducer)
  }

  computeAnnualBudget = () => {
    let annualBudgetItemAmounts = BUDGET_ITEMS
    .filter(budgetItem => budgetItem.frequency === "annually")
    .map(budgetItem => budgetItem.amount)
    return annualBudgetItemAmounts.reduce(this.reducer)
  }

  computeMonthlyLoanPayments = () => {
    let monthlyLoanPaymentAmounts = DEBTS
      .filter(loanPayment => loanPayment.frequency === "monthly")
      .map(loanPayment => loanPayment.monthlyPayment)
    return monthlyLoanPaymentAmounts.reduce(this.reducer)
  }

  getRemainingMonthsInYear = () => {
    let d = new Date()
    return 12 - d.getMonth(Date.now())
  }

  projectEOYAssetsByBudget = () => {
    // Hard coded
    let monthlyIncome = INCOME_SOURCES[0].amount
    let monthlyBudget = this.computeMonthlyBudget()
    let monthlyLoanPayments = this.computeMonthlyLoanPayments()
    let monthsLeftInYear = this.getRemainingMonthsInYear()
    return ASSETS.bankBalance + (monthlyIncome * monthsLeftInYear) - (monthlyBudget * monthsLeftInYear) - (monthsLeftInYear * monthlyLoanPayments)
  }

  projectEOYAssets = (startBalance) => {
    let monthlyIncome = INCOME_SOURCES[0].amount
    let monthlyBudget = this.computeMonthlyBudget()
    let monthlyLoanPayments = this.computeMonthlyLoanPayments()
    let annualBudget = this.computeAnnualBudget()
    return startBalance - annualBudget +
    (monthlyIncome * 12) - (monthlyBudget * 12) - (monthlyLoanPayments * 12)
  }

  renderLoanPayments = () => {
    const loanPayments = this.computeRemainingLoanPayments(
      /* currentBalance:*/
      DEBTS[0].currentBalance,
      /*interestRate:*/
      DEBTS[0].interestRate,
      /*monthlyPayment:*/
      DEBTS[0].monthlyPayment,
      /* paymentDayOfMonth:*/
      DEBTS[0].paymentDayOfMonth
      )
    return loanPayments.map(loanPayment =>
      <tr>
        <td>{moment(loanPayment.paymentDate).format('M/D/Y')}</td>
        <td>{this.formatter.format(loanPayment.paymentAmount)}</td>
        <td>{this.formatter.format(loanPayment.balance)}</td>
        <td>{this.formatter.format(loanPayment.accruedInterest)}</td>
      </tr>
    )
  }

  renderBudgetItems = () => {
    return BUDGET_ITEMS.map(budgetItem =>
        <p>{budgetItem.name}, {budgetItem.frequency}, {this.formatter.format(budgetItem.amount)}</p>
    )
  }

  render(){
    return(
      <div>
        <p>Monthly Budget: {this.formatter.format(this.computeMonthlyBudget())}
        </p>
        <p>Monthly Loan Payments: {this.formatter.format(this.computeMonthlyLoanPayments())}
        </p>
        <p>Current Bank Balance:
        {this.formatter.format(ASSETS.bankBalance)}
        </p>
        <p>Expected EOY Balance: {this.formatter.format(this.projectEOYAssetsByBudget())}
        </p>
        <p> Expected Balance at end of next year:  {this.formatter.format(
          this.projectEOYAssets(this.projectEOYAssetsByBudget())
        )}
        </p>
        <p> Budget Items </p>
        {this.renderBudgetItems()}
        <p>
          Remaining loan payments</p>
        <table>
          <thead>
            <tr>
              <th>Payment Date</th>
              <th>Payment Amount</th>
              <th>Remaining Balance</th>
              <th> Interest Accrued this Period</th>
            </tr>
          </thead>
          <tbody>
            {this.renderLoanPayments()
            }
          </tbody>
        </table>
      </div>
    )
  }
}
export default Main;
