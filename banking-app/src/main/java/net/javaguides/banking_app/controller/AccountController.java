package net.javaguides.banking_app.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.javaguides.banking_app.entity.Transaction;
import net.javaguides.banking_app.dto.AccountDto;
import net.javaguides.banking_app.dto.LoanRequestDto;
import net.javaguides.banking_app.dto.TransactionDto;
import net.javaguides.banking_app.dto.TransferRequestDto;
import net.javaguides.banking_app.entity.Loan;
import net.javaguides.banking_app.repository.AccountRepository;
import net.javaguides.banking_app.repository.TransactionRepository;
import net.javaguides.banking_app.service.AccountService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    //Add Account REST API//
    @PostMapping
    public ResponseEntity<AccountDto> addAccount(@RequestBody AccountDto accountDto){
        return new ResponseEntity<>(accountService.createAccount(accountDto), HttpStatus.CREATED);
    }

    //Get Account REST API//
    @GetMapping("/{id}")
    public ResponseEntity<AccountDto> getAccountById(@PathVariable Long id) {
        AccountDto accountDto = accountService.getAccountByID(id);
        return ResponseEntity.ok(accountDto);
    }

        // Deposit REST API//
    @PutMapping("/{id}/deposit")
        public ResponseEntity<AccountDto> deposit(@PathVariable Long id,
                                                   @RequestBody Map<String, Double> request){

            Double amount = request.get("amount");

           AccountDto accountDto =accountService.deposit(id, amount);
           return ResponseEntity.ok(accountDto);
        }

        //Withdraw REST API//
    @PutMapping("/{id}/withdraw")
    public ResponseEntity<AccountDto> withdraw(@PathVariable Long id,
                                               @RequestBody Map<String, Double> request){

        double amount = request.get("amount");

        AccountDto accountDto =accountService.withdraw(id, amount);
        return ResponseEntity.ok(accountDto);
    }

    // Get All Accounts REST API//
    @GetMapping
    public ResponseEntity<List<AccountDto>> getAllAccounts(){
        List<AccountDto> accounts = accountService.getAllAccounts();
        return ResponseEntity.ok(accounts);
    }
    //Delete account REST API//
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteAccount(@PathVariable Long id){
        accountService.deleteAccount(id);
        return ResponseEntity.ok("Account is deleted successfully!");
    }

    // Append these new routing actions inside your AccountController class mapping

    @PutMapping("/transfer")
    public ResponseEntity<String> transferAssets(@Valid @RequestBody TransferRequestDto transferRequestDto) {
        accountService.transferFunds(transferRequestDto);
        return ResponseEntity.ok("Financial asset transfer sequence completed successfully.");
    }

    @GetMapping("/{id}/transactions")
    public ResponseEntity<List<TransactionDto>> fetchAccountStatementAuditHistory(@PathVariable Long id) {
        List<TransactionDto> historyLogs = accountService.getAccountTransactionHistory(id);
        return ResponseEntity.ok(historyLogs);
    }

    @PostMapping("/{id}/loans")
    public ResponseEntity<?> requestFinancing(@PathVariable Long id, @RequestBody LoanRequestDto payload) {
        Loan loan = accountService.approveNewLoan(id, payload.getLoanAmount());
        return ResponseEntity.ok(loan);
    }
    @GetMapping("/summary/analytics")
    public ResponseEntity<Map<String, Object>> getSystemAnalytics() {
        Map<String, Object> stats = new HashMap<>();

        List<Transaction> allTx = transactionRepository.findAll();
        long totalAccountsCreated = accountRepository.count();

        long totalTransfersIn = allTx.stream()
                .filter(t -> "TRANSFER_IN".equalsIgnoreCase(t.getTransactionType()))
                .count();

        long loansApproved = allTx.stream()
                .filter(t -> "LOAN".equalsIgnoreCase(t.getTransactionType()))
                .count();

        stats.put("accounts_active", totalAccountsCreated);
        stats.put("transfers_in_count", totalTransfersIn);
        stats.put("loans_approved_count", loansApproved);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/settings")
    public ResponseEntity<Map<String, Object>> getSystemSettings() {
        Map<String, Object> settings = new HashMap<>();
        settings.put("environment", "Live Production");
        settings.put("maintenance_mode", false);
        return ResponseEntity.ok(settings);
    }

    @GetMapping("/security/summary")
    public ResponseEntity<Map<String, Object>> getSecuritySummary() {
        Map<String, Object> security = new HashMap<>();
        security.put("audit_logging", "Active");
        security.put("cors_status", "Enabled for http://localhost:5173");
        return ResponseEntity.ok(security);
    }
}
