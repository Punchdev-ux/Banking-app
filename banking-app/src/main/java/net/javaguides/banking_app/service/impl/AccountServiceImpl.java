package net.javaguides.banking_app.service.impl;

import lombok.RequiredArgsConstructor;
import net.javaguides.banking_app.dto.AccountDto;
import net.javaguides.banking_app.dto.TransactionDto;
import net.javaguides.banking_app.dto.TransferRequestDto;
import net.javaguides.banking_app.entity.Account;
import net.javaguides.banking_app.entity.Loan;
import net.javaguides.banking_app.entity.Transaction;
import net.javaguides.banking_app.exception.AccountNotFoundException;
import net.javaguides.banking_app.exception.InsufficientFundsException;
import net.javaguides.banking_app.mapper.AccountMapper;
import net.javaguides.banking_app.repository.AccountRepository;
import net.javaguides.banking_app.repository.LoanRepository;
import net.javaguides.banking_app.repository.TransactionRepository;
import net.javaguides.banking_app.service.AccountService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final LoanRepository loanRepository;

    @Override
    public AccountDto createAccount(AccountDto accountDto) {
        Account account = AccountMapper.mapToAccount(accountDto);
        Account savedAccount = accountRepository.save(account);
        return AccountMapper.mapToAccountDto(savedAccount);
    }

    @Override
    public AccountDto getAccountByID(Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new AccountNotFoundException("Account does not exist"));
        return AccountMapper.mapToAccountDto(account);
    }

    @Override
    @Transactional
    public AccountDto deposit(Long id, double amount) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new AccountNotFoundException("Account ID " + id + " not found."));

        account.setBalance(account.getBalance() + amount);
        Account savedAccount = accountRepository.save(account);

        // Append to Audit Trail Matrix
        transactionRepository.save(Transaction.builder()
                .accountId(id)
                .amount(amount)
                .transactionType("DEPOSIT")
                .timestamp(LocalDateTime.now())
                .details("Deposited cash via Web Portal Dashboard Console Instance.")
                .build());

        return AccountMapper.mapToAccountDto(savedAccount);
    }

    @Override
    @Transactional
    public AccountDto withdraw(Long id, double amount) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new AccountNotFoundException("Account ID " + id + " not found."));

        if (account.getBalance() < amount) {
            throw new InsufficientFundsException("Insufficient funds available to complete withdrawal processing.");
        }

        account.setBalance(account.getBalance() - amount);
        Account savedAccount = accountRepository.save(account);

        // Append to Audit Trail Matrix
        transactionRepository.save(Transaction.builder()
                .accountId(id)
                .amount(amount)
                .transactionType("WITHDRAWAL")
                .timestamp(LocalDateTime.now())
                .details("Withdrew cash via Web Portal Dashboard Console Instance.")
                .build());

        return AccountMapper.mapToAccountDto(savedAccount);
    }

    @Override
    @Transactional
    public void transferFunds(TransferRequestDto transferRequest) {
        Account sender = accountRepository.findById(transferRequest.getSenderAccountId())
                .orElseThrow(() -> new AccountNotFoundException("Sender account ID matching reference details could not be found."));

        Account receiver = accountRepository.findById(transferRequest.getReceiverAccountId())
                .orElseThrow(() -> new AccountNotFoundException("Target receiver distribution ledger target account ID could not be found."));

        if (sender.getBalance() < transferRequest.getAmount()) {
            throw new InsufficientFundsException("Sender does not have enough funds for transfer.");
        }

        sender.setBalance(sender.getBalance() - transferRequest.getAmount());
        receiver.setBalance(receiver.getBalance() + transferRequest.getAmount());

        accountRepository.save(sender);
        accountRepository.save(receiver);

        transactionRepository.save(Transaction.builder()
                .accountId(sender.getId())
                .amount(transferRequest.getAmount())
                .transactionType("TRANSFER_OUT")
                .timestamp(LocalDateTime.now())
                .details("Transferred funds to account ID: " + receiver.getId())
                .build());
    }

    @Override
    public List<AccountDto> getAllAccounts() {
        List<Account> accounts = accountRepository.findAll();
        return accounts.stream()
                .map(AccountMapper::mapToAccountDto)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteAccount(Long id) {
        if (!accountRepository.existsById(id)) {
            throw new AccountNotFoundException("Account does not exist");
        }
        accountRepository.deleteById(id);
    }

    @Override
    @Transactional
    public Loan approveNewLoan(Long accountId, double requestedAmount) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException("Profile not found"));

        // Business rule: Hold a balance equivalent to at least 10% of requested loan debt
        if (account.getBalance() < (requestedAmount * 0.10)) {
            // Save the rejection log in a separate isolated requires_new transaction context
            saveRejectionLog(accountId, requestedAmount);

            throw new InsufficientFundsException("Loan rejected: Insufficient base asset collateral thresholds.");
        }

        Loan loan = new Loan();
        loan.setLoanAmount(requestedAmount);
        loan.setInterestRate(12.5); // Standard fixed structural interest
        loan.setStatus("APPROVED");
        loan.setAccount(account);

        // Update their active checking balance with the new cash injection immediately
        account.setBalance(account.getBalance() + requestedAmount);
        accountRepository.save(account);

        // Log successful loan financing into audit trail matrix
        transactionRepository.save(Transaction.builder()
                .accountId(accountId)
                .amount(requestedAmount)
                .transactionType("LOAN_APPROVED")
                .timestamp(LocalDateTime.now())
                .details("Institutional loan financing approved and cash injected.")
                .build());

        return loanRepository.save(loan);
    }

    // Helper method to force-commit the rejection log even if the main transaction rolls back
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveRejectionLog(Long accountId, double requestedAmount) {
        transactionRepository.save(Transaction.builder()
                .accountId(accountId)
                .amount(requestedAmount)
                .transactionType("LOAN_REJECTED")
                .timestamp(LocalDateTime.now())
                .details("Loan application denied: Collateral threshold criteria mismatch.")
                .build());
    }

    public List<TransactionDto> getAccountTransactionHistory(Long accountId) {
        if (!accountRepository.existsById(accountId)) {
            throw new AccountNotFoundException("Account ID reference context could not be parsed.");
        }

        return transactionRepository.findByAccountIdOrderByTimestampDesc(accountId)
                .stream()
                .map(t -> new TransactionDto(
                        t.getId(),
                        t.getAccountId(),
                        t.getAmount(),
                        t.getTransactionType(),
                        t.getTimestamp(),
                        t.getDetails()
                ))
                .collect(Collectors.toList());
    }
}