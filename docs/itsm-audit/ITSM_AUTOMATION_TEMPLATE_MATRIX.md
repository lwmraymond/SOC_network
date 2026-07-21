# ITSM Automation Template Matrix

Date: 2026-07-21  
Repository: `lwmraymond/SOC_network`  
Branch: `agent/page-differentiation-audit`  
P34 evidence: `src/components/page-specific/P34PlaybooksAutomationTemplatesWorkspace.tsx` · blob `45a81ee52ae6a6b7033b497cab48fd7fbd5b5674` · checkpoint `b830865c79f660fc347361f123286212fc441230`.

## Conclusion

- Required named templates: **161**; exact `AUTO-*` records found: **0**.
- P34 has a generic `PB-*` library, Trigger/Condition/Action/Approval graph, inspector, simulation Flyout and run/publish Modal.
- `G` means generic builder/simulation only; `R` means revision label only. Generic capability is not named-template implementation.

| Template ID | Name | Category | Library card | Detail | Builder | Simulation | Version | Run history | Status | Evidence | Gap |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---|---|
| `AUTO-REQ-01` | 新 Request 自动分类 | Request | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-REQ-02` | 根据服务、地点、用户组自动路由 | Request | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-REQ-03` | VIP Request 优先级与专属队列 | Request | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-REQ-04` | Request 自动建议 Knowledge Article | Request | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-REQ-05` | Request 自动创建 fulfilment tasks | Request | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-REQ-06` | Request entitlement 校验 | Request | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-REQ-07` | Request 经理审批 | Request | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-REQ-08` | Request 多级审批 | Request | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-REQ-09` | Request 超时提醒 | Request | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-REQ-10` | Request SLA 风险升级 | Request | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-REQ-11` | 等待用户回复自动提醒 | Request | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-REQ-12` | 长期无回复自动关闭 | Request | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-REQ-13` | 完成后请求用户确认 | Request | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-REQ-14` | 关闭后发送满意度调查 | Request | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-REQ-15` | Linked request 状态同步 | Request | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CAT-01` | 软件许可证申请 | Service catalog | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CAT-02` | 应用访问权限申请 | Service catalog | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CAT-03` | VPN 访问申请 | Service catalog | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CAT-04` | 共享邮箱申请 | Service catalog | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CAT-05` | 群组成员变更 | Service catalog | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CAT-06` | 新员工 IT Onboarding | Service catalog | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CAT-07` | 员工 Offboarding | Service catalog | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CAT-08` | 硬件设备申请 | Service catalog | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CAT-09` | 移动设备申请 | Service catalog | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CAT-10` | VM / Cloud Resource 申请 | Service catalog | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CAT-11` | Database Access 申请 | Service catalog | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CAT-12` | Certificate 申请与续期 | Service catalog | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CAT-13` | Procurement / Purchase 请求 | Service catalog | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CAT-14` | Password / MFA Reset | Service catalog | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CAT-15` | Temporary Elevated Access | Service catalog | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INC-01` | Monitoring Alert 自动创建 Incident | Incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INC-02` | Alert/Incident 去重与关联 | Incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INC-03` | 自动计算 impact、urgency、priority | Incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INC-04` | 根据 service/CI 自动分派 | Incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INC-05` | 未确认 Incident 自动升级 | Incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INC-06` | SLA 风险自动通知 | Incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INC-07` | 自动建议 Knowledge / Known Error | Incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INC-08` | 多个相似 Incident 自动建立关联 | Incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INC-09` | Incident 自动创建 Problem candidate | Incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INC-10` | Incident 自动创建 Change candidate | Incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INC-11` | Incident pending customer reminder | Incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INC-12` | Resolution validation | Incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INC-13` | Resolved Incident requester confirmation | Incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INC-14` | Reopen on requester response | Incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INC-15` | Create knowledge draft from resolution | Incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-MI-01` | P1/P2 自动提议 Major Incident | Major incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-MI-02` | 自动通知 Incident Commander | Major incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-MI-03` | 自动组建 Response Team | Major incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-MI-04` | 自动创建 Bridge / Chat Channel | Major incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-MI-05` | 自动创建 Major Incident tasks | Major incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-MI-06` | Stakeholder Communication | Major incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-MI-07` | Status Page 创建与更新 | Major incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-MI-08` | 定时状态更新提醒 | Major incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-MI-09` | 服务恢复验证 | Major incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-MI-10` | 自动创建 Post-Incident Review | Major incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-MI-11` | 自动创建 Problem record | Major incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-MI-12` | Leadership notification | Major incident | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-PRB-01` | Incident recurrence threshold → Problem | Problem | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-PRB-02` | 相似 Incident 聚类 | Problem | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-PRB-03` | 创建 RCA task set | Problem | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-PRB-04` | Known Error 建立 | Problem | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-PRB-05` | Workaround 发布 | Problem | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-PRB-06` | 关联已有 Knowledge Article | Problem | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-PRB-07` | 创建 permanent-fix Change | Problem | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-PRB-08` | RCA overdue escalation | Problem | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-PRB-09` | Problem closure validation | Problem | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-PRB-10` | Known Error 定期复核 | Problem | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-01` | Change 创建后自动识别 change type | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-02` | 自动风险评估 | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-03` | Standard Change 自动批准 | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-04` | Low-risk Change 快速审批 | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-05` | Normal Change CAB routing | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-06` | Emergency Change escalation | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-07` | Change collision detection | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-08` | Freeze window validation | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-09` | 自动生成 implementation tasks | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-10` | Deployment started → In progress | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-11` | Deployment completed → Validate | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-12` | Deployment failed → Failed state | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-13` | Failed Change 自动发起 rollback | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-14` | Change window reminder | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-15` | Post-implementation review | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-16` | Successful Change 自动关闭 | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-17` | Failed Change 自动创建 Problem | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CHG-18` | CAB agenda generation | Change | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-APR-01` | 根据金额选择审批链 | Approval | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-APR-02` | 根据风险选择审批链 | Approval | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-APR-03` | 根据服务/系统选择 approver | Approval | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-APR-04` | CAB quorum 检查 | Approval | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-APR-05` | Approval reminder | Approval | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-APR-06` | Approval overdue escalation | Approval | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-APR-07` | Approver delegation | Approval | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-APR-08` | Separation-of-Duties conflict | Approval | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-APR-09` | Rejection reason validation | Approval | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-APR-10` | Approval decision receipt | Approval | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SLA-01` | SLA warning | SLA / Queue | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SLA-02` | SLA breach escalation | SLA / Queue | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SLA-03` | Assignment timeout | SLA / Queue | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SLA-04` | Unassigned aging escalation | SLA / Queue | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SLA-05` | After-hours routing | SLA / Queue | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SLA-06` | Skill-based routing | SLA / Queue | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SLA-07` | Workload balancing | SLA / Queue | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SLA-08` | Vendor OLA escalation | SLA / Queue | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SLA-09` | Pending state pause/resume | SLA / Queue | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SLA-10` | Breach reason capture | SLA / Queue | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-KB-01` | Share article with requester | Knowledge | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-KB-02` | Resolution → Knowledge draft | Knowledge | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-KB-03` | Known Error → Workaround article | Knowledge | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-KB-04` | Article review reminder | Knowledge | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-KB-05` | Article expiry | Knowledge | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-KB-06` | Low feedback escalation | Knowledge | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-KB-07` | Duplicate article candidate | Knowledge | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-KB-08` | Article ownership reassignment | Knowledge | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-KB-09` | Unpublished draft reminder | Knowledge | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-KB-10` | Knowledge gap detection | Knowledge | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CMDB-01` | CI owner enrichment | Asset / CMDB | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CMDB-02` | Service/CI impact calculation | Asset / CMDB | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CMDB-03` | Stale CI warning | Asset / CMDB | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CMDB-04` | Duplicate CI reconciliation | Asset / CMDB | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CMDB-05` | Asset lifecycle update | Asset / CMDB | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CMDB-06` | New employee asset assignment | Asset / CMDB | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CMDB-07` | Offboarding asset recovery | Asset / CMDB | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CMDB-08` | License threshold warning | Asset / CMDB | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CMDB-09` | Certificate expiry warning | Asset / CMDB | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-CMDB-10` | CI relationship integrity check | Asset / CMDB | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INT-01` | Monitoring platform → Incident | Integration | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INT-02` | SOC Case → ITSM Incident | Integration | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INT-03` | Vulnerability → Remediation Request | Integration | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INT-04` | CI/CD deployment → Change update | Integration | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INT-05` | IAM approval → Access provision | Integration | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INT-06` | HR event → Onboarding/Offboarding | Integration | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INT-07` | Chat command → Work item update | Integration | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INT-08` | Status Page synchronization | Integration | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INT-09` | External ITSM field synchronization | Integration | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INT-10` | Sync conflict reconciliation | Integration | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INT-11` | Connector failure retry | Integration | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-INT-12` | Webhook signature failure handling | Integration | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SOC-01` | High severity alert → Incident candidate | SOC / ITSM | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SOC-02` | Confirmed SOC Case → ITSM Incident | SOC / ITSM | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SOC-03` | Security response requiring downtime → Change | SOC / ITSM | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SOC-04` | Containment action → Approval | SOC / ITSM | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SOC-05` | Vulnerability exposure → Remediation task | SOC / ITSM | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SOC-06` | Security evidence → Work item attachment | SOC / ITSM | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SOC-07` | Incident service/CI impact enrichment | SOC / ITSM | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SOC-08` | Security severity → impact/urgency mapping | SOC / ITSM | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SOC-09` | SOC Case closure → ITSM reconciliation | SOC / ITSM | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SOC-10` | ITSM Change failure → SOC monitoring task | SOC / ITSM | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SOC-11` | ITSM Major Incident → SOC hunt task | SOC / ITSM | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-SOC-12` | Sync conflict → governed review | SOC / ITSM | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-RPT-01` | Daily queue report | Reporting / Governance | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-RPT-02` | Weekly SLA report | Reporting / Governance | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-RPT-03` | Major incident summary | Reporting / Governance | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-RPT-04` | Change success report | Reporting / Governance | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-RPT-05` | Automation failure report | Reporting / Governance | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-RPT-06` | Scheduled export | Reporting / Governance | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-GOV-01` | Permission change approval | Reporting / Governance | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-GOV-02` | Emergency override expiry | Reporting / Governance | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-GOV-03` | Configuration review reminder | Reporting / Governance | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-GOV-04` | Audit anomaly notification | Reporting / Governance | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-GOV-05` | Data retention action | Reporting / Governance | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |
| `AUTO-GOV-06` | Secret / credential rotation reminder | Reporting / Governance | No | No | G | G | R | No | `ABSENT` | No exact record | Add exact contract + fixtures |

## P34 region audit

| Region | Current evidence | Status | Required correction |
|---|---|---|---|
| Library | Search/lifecycle filter and generic `PB-*` cards | `REWORK_REQUIRED` | Add exact `AUTO-*` records, category/trigger/capability/owner/status/version/last-run/validation/dependency filters, clone and deprecate |
| Detail | Selected playbook identity/summary only | `PLACEHOLDER` | Add applicability, I/O, conditions, actions, human tasks, approvals, timeout/retry/error/rollback, capabilities, secrets, dependencies, consumers and outcomes |
| Builder | Trigger, Condition, Action, Approval | `UI_INTERACTIVE_DEMO` | Add branch, human task, timer, notification, integration, error handler, rollback and output |
| Inspector | Node ID, capability, compact JSON and path coverage | `REWORK_REQUIRED` | Add mappings, secret refs, timeout/retry, validation/dependencies and correct read-only semantics |
| Validation/simulation | Generic receipt and trace | `UI_INTERACTIVE_DEMO` | Add schema, missing-field, capability, branch, unreachable-step and rollback checks plus sample/expected/actual context |
| Version/publish | Revision label and impact Modal | `PLACEHOLDER` | Add draft→validated→approved→published→deprecated lifecycle, diff, effective time, approval, rollback and receipt |
| Run history | Aggregate failure/manual metrics only | `ABSENT` | Add run/version/trigger/target/status/steps/approvals/outputs/errors/retry/cancel/manual intervention/receipt |

The current `Playbook` type exposes only 12 fields (`id`, `name`, `category`, `lifecycle`, `owner`, `trigger`, `steps`, `dependency`, `validation`, `success`, `manual`, `revision`), while the task requires roughly thirty operational fields. This is a structural data-contract gap.
