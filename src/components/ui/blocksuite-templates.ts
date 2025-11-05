// Template content loaded on-demand to reduce initial bundle size

export type TemplateType = "brainstorm" | "meeting" | "project" | "swot";

export function getTemplateContent(type: TemplateType): string {
  const templates: Record<TemplateType, string> = {
    brainstorm: `## 🚀 Brainstorming Session

### 💡 Ideas
- **Idea 1**: First creative thought with potential impact
- **Idea 2**: Second innovative approach worth exploring
- **Idea 3**: Third brilliant concept to develop further

### 🎯 Focus Areas
- **Innovation**: Push boundaries and think differently
- **Feasibility**: Consider practical implementation
- **Impact**: Evaluate potential outcomes

### 📋 Next Steps
- [ ] Prioritize top 3 ideas
- [ ] Research market demand
- [ ] Prototype chosen concept
- [ ] Gather user feedback

### 🔄 Iteration Cycle
*Generated with AI on ${new Date().toLocaleDateString()}*`,

    meeting: `## 📅 Meeting Notes - ${new Date().toLocaleDateString()}

### 👥 Attendees
- [ ] [Name 1] - Role/Department
- [ ] [Name 2] - Role/Department  
- [ ] [Name 3] - Role/Department

### 📋 Agenda
1. Topic 1 - [Owner]
2. Topic 2 - [Owner]
3. Topic 3 - [Owner]

### 💬 Discussion Points

#### Topic 1
- Key discussion point 1
- Decision made: [Decision]
- Rationale: [Reason]

#### Topic 2
- Key discussion point 2
- Action item: [Owner] - [Task] - [Due Date]

#### Topic 3
- Key discussion point 3
- Budget consideration: [Amount]

### ✅ Action Items
- [ ] **[Task Description]** - [Owner] - [Due Date]
- [ ] **[Task Description]** - [Owner] - [Due Date]
- [ ] **[Task Description]** - [Owner] - [Due Date]

### 📅 Next Meeting
- **Date**: [Date]
- **Time**: [Time]
- **Agenda**: [Key topics]

---
*Generated with AI • Ready for collaboration*`,

    project: `## 🎯 Project Plan: [Project Name]

### 📊 Overview
- **Objective**: [Primary goal description]
- **Timeline**: [Duration]
- **Budget**: [Estimated cost]
- **Team**: [Key members]

### 📅 Timeline & Milestones

#### Phase 1: Planning (Weeks 1-2)
- [ ] Define requirements
- [ ] Create wireframes/prototypes
- [ ] Set up development environment
- [ ] Stakeholder approval

#### Phase 2: Development (Weeks 3-8)
- [ ] Frontend development
- [ ] Backend development
- [ ] API integrations
- [ ] Unit testing

#### Phase 3: Testing (Weeks 9-10)
- [ ] QA testing
- [ ] User acceptance testing
- [ ] Performance optimization
- [ ] Bug fixes

#### Phase 4: Launch (Weeks 11-12)
- [ ] Production deployment
- [ ] Documentation completion
- [ ] Team training
- [ ] Post-launch monitoring

### ⚠️ Risks & Mitigation
- **Risk 1**: [Description]
  - *Mitigation*: [Strategy]
- **Risk 2**: [Description]
  - *Mitigation*: [Strategy]

### 📈 Success Metrics
- [ ] **Metric 1**: [Target value]
- [ ] **Metric 2**: [Target value]
- [ ] **Metric 3**: [Target value]

### 💰 Resource Requirements
- **Development**: [Hours/Resources]
- **Design**: [Hours/Resources]
- **Testing**: [Hours/Resources]

---
*Generated with AI • Project Ready for Kickoff*`,

    swot: `## 📊 SWOT Analysis - [Topic/Company/Project]

### 💪 Strengths (Internal, Positive)
- **S1**: [Internal strength 1]
- **S2**: [Internal strength 2]
- **S3**: [Internal strength 3]
- **S4**: [Internal strength 4]

### ⚡ Weaknesses (Internal, Negative)
- **W1**: [Internal weakness 1]
- **W2**: [Internal weakness 2]
- **W3**: [Internal weakness 3]
- **W4**: [Internal weakness 4]

### 🌟 Opportunities (External, Positive)
- **O1**: [External opportunity 1]
- **O2**: [External opportunity 2]
- **O3**: [External opportunity 3]
- **O4**: [External opportunity 4]

### ⚠️ Threats (External, Negative)
- **T1**: [External threat 1]
- **T2**: [External threat 2]
- **T3**: [External threat 3]
- **T4**: [External threat 4]

### 🎯 Strategic Insights
- **SO Strategy**: Use strengths to capitalize on opportunities
- **WO Strategy**: Address weaknesses to seize opportunities
- **ST Strategy**: Use strengths to avoid threats
- **WT Strategy**: Defensive strategy to minimize weaknesses and threats

### ✅ Action Items
- [ ] Leverage top 2 strengths for opportunities
- [ ] Address top 2 weaknesses that impact opportunities
- [ ] Develop mitigation plan for top 2 threats

---
*Generated with AI • Strategic Planning Complete*`
  };

  return templates[type];
}

