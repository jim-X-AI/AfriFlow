# FILE: backend/dispute_ai.py
#
# AI Dispute Resolution Pipeline
# Uses Groq Fast Inference API (llama-3.3-70b-versatile)
# Falls back to rule-based resolution if API unavailable.

import os
import json
import re
from groq import Groq

GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')


def build_dispute_prompt(trade, dispute, buyer, supplier,
                         buyer_trust, supplier_trust, evidence_list) -> str:
    buyer_evidence = [
        e for e in evidence_list if e.submitted_by == trade.buyer_id
    ]
    supplier_evidence = [
        e for e in evidence_list if e.submitted_by == trade.supplier_id
    ]

    buyer_trust_dict = buyer_trust.to_dict() if buyer_trust else {}
    supplier_trust_dict = supplier_trust.to_dict() if supplier_trust else {}

    buyer_ev_text = '\n'.join([
        f"  - [{e.evidence_type}] {e.content}" for e in buyer_evidence
    ]) or '  - No evidence submitted'

    supplier_ev_text = '\n'.join([
        f"  - [{e.evidence_type}] {e.content}" for e in supplier_evidence
    ]) or '  - No evidence submitted'

    prompt = f"""You are AfriFlow's AI Trade Arbitrator. Analyze this cross-border B2B trade dispute between African businesses and issue a fair, evidence-based resolution.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRADE AGREEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trade ID: {trade.id}
Goods: {trade.description}
Quantity: {trade.quantity}
Value: {trade.currency} {trade.amount:,.0f}
Delivery Window: {trade.delivery_days} days
Release Condition: {trade.release_condition}
Current Status: {trade.status}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARTIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUYER: {buyer.business_name} ({buyer.location})
  Trust Score: {buyer_trust_dict.get('overall_score', 'N/A')}/100
  Total Trades: {buyer_trust_dict.get('total_trades', 0)}
  Dispute Rate: {buyer_trust_dict.get('dispute_rate', 'N/A')}

SUPPLIER: {supplier.business_name} ({supplier.location})
  Trust Score: {supplier_trust_dict.get('overall_score', 'N/A')}/100
  Total Trades: {supplier_trust_dict.get('total_trades', 0)}
  Delivery Accuracy: {supplier_trust_dict.get('delivery_accuracy', 'N/A')}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DISPUTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Raised By: {'Buyer' if dispute.raised_by == trade.buyer_id else 'Supplier'}
Reason: {dispute.reason}
Description: {dispute.description or 'None provided'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUYER EVIDENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{buyer_ev_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPPLIER EVIDENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{supplier_ev_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyze the evidence carefully. Consider:
1. Who bears the burden of proof for this type of dispute
2. Quality and specificity of evidence from each party
3. Trust histories and behavioral patterns
4. Standard trade practices for African cross-border goods trade
5. Which party's account is more consistent with the evidence

You MUST respond with ONLY valid JSON in this exact format:
{{
  "confidence": <integer 0-100>,
  "finding": "<2-3 sentence factual finding based on evidence>",
  "recommendation": "<1-2 sentence recommended action>",
  "resolution_type": "<one of: release_to_supplier | refund_to_buyer | partial_refund | escalate_to_human>",
  "reasoning_steps": ["<step 1>", "<step 2>", "<step 3>"]
}}

Do not include any text outside the JSON object."""

    return prompt


def rule_based_fallback(trade, dispute, buyer_trust, supplier_trust, evidence_list) -> dict:
    """
    Deterministic fallback when Groq API is unavailable.
    Used for offline demos and rate limit scenarios.
    """
    buyer_evidence = [e for e in evidence_list if e.submitted_by == trade.buyer_id]
    supplier_evidence = [e for e in evidence_list if e.submitted_by == trade.supplier_id]

    buyer_score = buyer_trust.overall_score if buyer_trust else 50
    supplier_score = supplier_trust.overall_score if supplier_trust else 50

    buyer_ev_count = len(buyer_evidence)
    supplier_ev_count = len(supplier_evidence)

    reason_lower = dispute.reason.lower()

    # Damage in transit — typically courier responsibility, favor supplier
    if any(word in reason_lower for word in ['damaged', 'damage', 'broken', 'transit']):
        confidence = 88
        resolution_type = 'release_to_supplier'
        finding = (
            "Evidence pattern is consistent with transit damage rather than supplier negligence. "
            "Goods were confirmed packaged before dispatch. "
            "Damage occurred during courier handling outside supplier's control."
        )
        recommendation = "Release funds to supplier. Flag courier for review."

    # Non-delivery — favor buyer if no tracking
    elif any(word in reason_lower for word in ['not delivered', 'never arrived', 'missing']):
        if supplier_ev_count > 0:
            confidence = 79
            resolution_type = 'release_to_supplier'
            finding = (
                "Supplier submitted delivery evidence including tracking documentation. "
                "Delivery records indicate goods were dispatched within agreed window. "
                "Buyer's non-receipt claim is not supported by contradicting evidence."
            )
            recommendation = "Release funds to supplier. Buyer should check with courier."
        else:
            confidence = 82
            resolution_type = 'refund_to_buyer'
            finding = (
                "Supplier has not provided delivery confirmation or tracking evidence. "
                "Buyer's claim of non-receipt is uncontested by documentation. "
                "Without proof of delivery, funds cannot be released."
            )
            recommendation = "Refund funds to buyer. Supplier should provide tracking documentation."

    # Wrong goods — weigh evidence count
    elif any(word in reason_lower for word in ['wrong', 'incorrect', 'different', 'not what']):
        if buyer_ev_count >= supplier_ev_count:
            confidence = 76
            resolution_type = 'refund_to_buyer'
            finding = (
                "Buyer has provided photographic evidence suggesting goods differ from agreed description. "
                "Supplier has not submitted counter-evidence confirming goods matched specifications. "
                "The discrepancy between ordered and received items supports the buyer's claim."
            )
            recommendation = "Refund to buyer. Supplier should verify their fulfillment process."
        else:
            confidence = 71
            resolution_type = 'escalate_to_human'
            finding = (
                "Both parties have submitted conflicting evidence about goods description. "
                "The evidence is insufficient for automated resolution with high confidence. "
                "This case requires human arbitration to examine physical evidence."
            )
            recommendation = "Escalate to human arbitrator for physical inspection."

    # Default — weigh trust scores
    else:
        score_diff = abs(buyer_score - supplier_score)
        if score_diff > 20:
            if supplier_score > buyer_score:
                confidence = 72
                resolution_type = 'release_to_supplier'
                finding = (
                    "Available evidence is limited but supplier has a significantly stronger "
                    "verified trade history. No concrete evidence of supplier failure was presented. "
                    "Balance of evidence favors supplier fulfillment."
                )
                recommendation = "Release funds to supplier. Monitor for future disputes."
            else:
                confidence = 68
                resolution_type = 'escalate_to_human'
                finding = (
                    "Evidence is inconclusive. Trust history does not clearly favor either party. "
                    "Confidence level is below threshold for automated resolution."
                )
                recommendation = "Escalate to human arbitrator."
        else:
            confidence = 61
            resolution_type = 'escalate_to_human'
            finding = (
                "Evidence submitted by both parties is insufficient for high-confidence resolution. "
                "The dispute requires human review with physical evidence verification."
            )
            recommendation = "Escalate to human arbitrator within 24 hours."

    return {
        'confidence': confidence,
        'finding': finding,
        'recommendation': recommendation,
        'resolution_type': resolution_type,
        'reasoning_steps': [
            f"Analyzed dispute reason: {dispute.reason}",
            f"Reviewed {buyer_ev_count} buyer evidence items and {supplier_ev_count} supplier evidence items",
            f"Compared trust profiles: Buyer {buyer_score}/100 vs Supplier {supplier_score}/100",
            f"Applied trade dispute pattern matching for '{reason_lower}' category",
            f"Confidence threshold: {'AUTO-RESOLVE' if confidence >= 85 else 'ESCALATE'}"
        ],
        'source': 'rule_based_fallback'
    }


def analyze_dispute_with_ai(trade, dispute, buyer, supplier,
                             buyer_trust, supplier_trust, evidence_list) -> dict:
    """
    Main entry point for dispute analysis.
    Attempts Groq API first, falls back to rule-based engine.
    """
    if not GROQ_API_KEY:
        print("[AfriFlow AI] No GROQ_API_KEY found. Using rule-based fallback.")
        result = rule_based_fallback(trade, dispute, buyer_trust, supplier_trust, evidence_list)
        result['source'] = 'rule_based_fallback'
        return result

    try:
        client = Groq(api_key=GROQ_API_KEY)
        prompt = build_dispute_prompt(
            trade, dispute, buyer, supplier,
            buyer_trust, supplier_trust, evidence_list
        )

        response = client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[
                {
                    'role': 'system',
                    'content': (
                        'You are AfriFlow AI Trade Arbitrator. '
                        'You always respond with valid JSON only. '
                        'No markdown. No explanation outside JSON.'
                    )
                },
                {'role': 'user', 'content': prompt}
            ],
            temperature=0.1,
            max_tokens=800
        )

        raw = response.choices[0].message.content.strip()

        # Strip markdown code fences if present
        raw = re.sub(r'^```json\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)

        parsed = json.loads(raw)

        return {
            'confidence': int(parsed.get('confidence', 70)),
            'finding': parsed.get('finding', ''),
            'recommendation': parsed.get('recommendation', ''),
            'resolution_type': parsed.get('resolution_type', 'escalate_to_human'),
            'reasoning_steps': parsed.get('reasoning_steps', []),
            'source': 'groq_llama3'
        }

    except json.JSONDecodeError as e:
        print(f"[AfriFlow AI] JSON parse error: {e}. Using fallback.")
        return rule_based_fallback(trade, dispute, buyer_trust, supplier_trust, evidence_list)

    except Exception as e:
        print(f"[AfriFlow AI] Groq API error: {e}. Using fallback.")
        result = rule_based_fallback(trade, dispute, buyer_trust, supplier_trust, evidence_list)
        result['source'] = 'rule_based_fallback'
        return result