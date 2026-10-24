package net.javaguides.banking_app.service;

import net.javaguides.banking_app.dto.AccountDto;
import net.javaguides.banking_app.dto.TransactionDto;
import net.javaguides.banking_app.dto.TransferRequestDto;
import net.javaguides.banking_app.entity.Loan;

import java.util.List;

public interface AccountService {

    AccountDto createAccount(AccountDto accountDto);

    AccountDto getAccountByID(Long id);

    AccountDto deposit(Long id, double amount);

    AccountDto withdraw(Long id, double amount);

    List<AccountDto> getAllAccounts();

    void transferFunds(TransferRequestDto transferRequest);

    void deleteAccount(Long id);

    Loan approveNewLoan(Long accountId, double requestedAmount);

    List<TransactionDto> getAccountTransactionHistory(Long accountId);
}