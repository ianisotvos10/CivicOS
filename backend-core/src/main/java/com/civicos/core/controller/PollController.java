package com.civicos.core.controller;

import com.civicos.core.model.Poll;
import com.civicos.core.model.PollVote;
import com.civicos.core.repository.PollRepository;
import com.civicos.core.repository.PollVoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/polls")
@CrossOrigin(origins = "*")
public class PollController {

    @Autowired
    private PollRepository pollRepository;

    @Autowired
    private PollVoteRepository pollVoteRepository;

    @GetMapping
    public List<Map<String, Object>> getActivePolls() {
        List<Poll> polls = pollRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
        return enrichWithVoteCounts(polls);
    }

    @GetMapping("/all")
    public List<Map<String, Object>> getAllPolls() {
        List<Poll> polls = pollRepository.findAll();
        return enrichWithVoteCounts(polls);
    }

    private List<Map<String, Object>> enrichWithVoteCounts(List<Poll> polls) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Poll poll : polls) {
            Map<String, Object> pollData = new LinkedHashMap<>();
            pollData.put("id", poll.getId());
            pollData.put("question", poll.getQuestion());
            pollData.put("options", poll.getOptions());
            pollData.put("status", poll.getStatus());
            pollData.put("expiresAt", poll.getExpiresAt());
            pollData.put("createdAt", poll.getCreatedAt());
            // Calculam voturile per optiune
            List<Long> voteCounts = new ArrayList<>();
            long totalVotes = 0;
            for (int i = 0; i < poll.getOptions().size(); i++) {
                long cnt = pollVoteRepository.countByPollIdAndOptionIndex(poll.getId(), i);
                voteCounts.add(cnt);
                totalVotes += cnt;
            }
            pollData.put("voteCounts", voteCounts);
            pollData.put("totalVotes", totalVotes);
            result.add(pollData);
        }
        return result;
    }

    @PostMapping
    public ResponseEntity<Poll> createPoll(@RequestBody Poll poll) {
        poll.setStatus("ACTIVE");
        return ResponseEntity.ok(pollRepository.save(poll));
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<?> vote(@PathVariable UUID id,
                                   @RequestParam String citizenCnp,
                                   @RequestParam Integer optionIndex) {
        Poll poll = pollRepository.findById(id).orElse(null);
        if (poll == null) return ResponseEntity.notFound().build();
        if (!"ACTIVE".equals(poll.getStatus())) return ResponseEntity.badRequest().body("Sondajul este închis.");
        if (optionIndex < 0 || optionIndex >= poll.getOptions().size()) return ResponseEntity.badRequest().body("Opțiune invalidă.");
        if (pollVoteRepository.existsByPollIdAndCitizenCnp(id, citizenCnp)) {
            return ResponseEntity.badRequest().body("Ai votat deja la acest sondaj.");
        }
        PollVote vote = new PollVote();
        vote.setPollId(id);
        vote.setCitizenCnp(citizenCnp);
        vote.setOptionIndex(optionIndex);
        pollVoteRepository.save(vote);
        return ResponseEntity.ok("Vot înregistrat cu succes!");
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<?> closePoll(@PathVariable UUID id) {
        return pollRepository.findById(id).map(p -> {
            p.setStatus("CLOSED");
            pollRepository.save(p);
            return ResponseEntity.ok("Sondaj închis.");
        }).orElse(ResponseEntity.notFound().build());
    }
}
