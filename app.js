const STORAGE_KEY = "volunteer-review-mvp-v1";

const statusMap = {
  draft: "未提交",
  pending_payment: "待支付",
  pending_assign: "待分配",
  pending_review: "待审核",
  reviewing: "审核中",
  pending_material: "待补充资料",
  completed: "已完成",
  re_reviewing: "复核中",
  closed: "服务结束",
  cancelled: "已取消",
};

const statusFlow = [
  "draft",
  "pending_payment",
  "pending_assign",
  "pending_review",
  "reviewing",
  "pending_material",
  "completed",
  "re_reviewing",
  "closed",
];

const packageMap = {
  single: {
    name: "单次深度审核",
    price: 299,
    slaHours: 24,
    benefits: "1 次审核，文字报告，可选语音说明，适合已基本确定志愿表的家庭。",
  },
  escort: {
    name: "全程护航套餐",
    price: 499,
    slaHours: 12,
    benefits: "最多 3 轮复核，优先处理，文字报告与语音解读，适合仍会调整方案的家庭。",
  },
};

const riskTypes = [
  "选科不符",
  "体检限制",
  "外语限制",
  "梯度不合理",
  "滑档风险",
  "退档风险",
  "代码/批次错误",
  "学费/中外合作风险",
  "城市/专业匹配不足",
];

const subjectOptions = ["物理", "化学", "生物", "历史", "地理", "政治"];
const provinceOptions = ["广东", "浙江", "山东", "江苏", "湖北"];

const sampleRows = [
  ["本科批", "1", "10558", "中山大学", "205", "临床医学", "服从调剂"],
  ["本科批", "2", "10532", "湖南大学", "203", "计算机类", "服从调剂"],
  ["本科批", "3", "10486", "武汉大学", "207", "遥感科学", "不服从调剂"],
  ["本科批", "4", "10213", "哈尔滨工业大学", "201", "工科试验班", "服从调剂"],
  ["本科批", "5", "10590", "深圳大学", "214", "电子信息", "服从调剂"],
];

let state = loadState();

function defaultState() {
  const now = new Date();
  const orderA = makeOrder({
    orderNo: "ORD20260604001",
    status: "pending_assign",
    packageType: "single",
    student: {
      name: "王同学",
      province: "广东",
      score: 626,
      rank: 4850,
      subjects: ["物理", "化学", "生物"],
      medical: "完全合格",
      language: "英语",
      phone: "13800000000",
      email: "parent@example.com",
      preferences: "希望优先考虑省内院校，计算机或电子信息方向。",
    },
    submittedAt: addMinutes(now, -170),
  });

  const orderB = makeOrder({
    orderNo: "ORD20260604002",
    status: "pending_review",
    packageType: "escort",
    consultantId: "c1",
    student: {
      name: "李同学",
      province: "广东",
      score: 598,
      rank: 11230,
      subjects: ["物理", "化学"],
      medical: "色弱",
      language: "英语",
      phone: "13800000000",
      email: "",
      preferences: "不接受中外合作，高学费项目需谨慎。",
    },
    submittedAt: addMinutes(now, -320),
  });

  const orderC = makeOrder({
    orderNo: "ORD20260604003",
    status: "completed",
    packageType: "single",
    consultantId: "c2",
    student: {
      name: "陈同学",
      province: "浙江",
      score: 641,
      rank: 6200,
      subjects: ["物理", "化学", "地理"],
      medical: "完全合格",
      language: "英语",
      phone: "13800000000",
      email: "",
      preferences: "更看重专业质量，可接受省外城市。",
    },
    submittedAt: addMinutes(now, -900),
  });

  orderC.report = {
    summary: "本志愿方案整体属于基本可用，但冲刺区间略集中，保底志愿数量不足。主要问题集中在部分院校专业组录取位次高于当前位次、个别专业调剂风险较高。",
    adjustment: "建议补充 2-3 个近三年位次稳定低于考生位次的保底专业组；冲刺方案保留 2 个代表性目标即可；对不服从调剂的专业组逐一核对退档风险。",
    audioNote: "已录制 4 分钟语音解读",
    submittedAt: addMinutes(now, -110),
    risks: [
      {
        id: uid("risk"),
        level: "high",
        type: "滑档风险",
        position: "本科批 / 第 3 志愿 / 武汉大学 207",
        problem: "该专业组近年录取位次明显高于考生当前位次，且后续保底衔接不足。",
        suggestion: "建议将该志愿保留为冲刺项，同时增加 2 个更稳妥的保底专业组。",
      },
      {
        id: uid("risk"),
        level: "medium",
        type: "退档风险",
        position: "本科批 / 第 8 志愿 / 某医学类专业",
        problem: "专业要求较严格，若不服从调剂可能增加退档风险。",
        suggestion: "提交前再次核对招生章程和专业限制，必要时改为服从调剂。",
      },
    ],
  };

  return {
    ui: {
      role: "user",
      view: "userHome",
      userOrderFilter: "all",
      adminOrderFilter: "all",
      selectedOrderId: orderC.id,
      consultantOrderId: orderB.id,
      submitStep: 1,
    },
    draft: {
      fileName: "",
      fileSize: "",
      preview: [],
      student: {
        name: "",
        province: "广东",
        score: "",
        rank: "",
        subjects: [],
        medical: "完全合格",
        language: "英语",
        phone: "13800000000",
        email: "",
        preferences: "",
      },
      packageType: "single",
      inviteCode: "",
      inviteResult: null,
      agreement: false,
    },
    orders: [orderA, orderB, orderC],
    consultants: [
      {
        id: "c1",
        name: "张老师",
        status: "online",
        expertise: "理工类、广东省",
        currentLoad: 1,
        avgMinutes: 38,
        rating: 4.8,
      },
      {
        id: "c2",
        name: "周老师",
        status: "online",
        expertise: "医学类、长三角",
        currentLoad: 1,
        avgMinutes: 42,
        rating: 4.7,
      },
      {
        id: "c3",
        name: "许老师",
        status: "resting",
        expertise: "财经类、华中",
        currentLoad: 0,
        avgMinutes: 35,
        rating: 4.9,
      },
    ],
    inviteCodes: [
      {
        code: "TEST2026",
        packageType: "all",
        discountType: "full",
        discountValue: 999,
        maxUsage: 50,
        usedCount: 7,
        expiredAt: "2026-06-20",
        source: "内测全额抵扣",
      },
      {
        code: "CARE100",
        packageType: "escort",
        discountType: "amount",
        discountValue: 100,
        maxUsage: 20,
        usedCount: 3,
        expiredAt: "2026-06-20",
        source: "全程套餐优惠",
      },
    ],
    reviewDrafts: {},
    feedbacks: [
      {
        id: uid("fb"),
        orderId: orderC.id,
        score: 9,
        nps: "yes",
        category: "report_value",
        content: "报告把冲稳保问题讲清楚了，调整建议可以直接执行。",
        createdAt: addMinutes(now, -70).toISOString(),
      },
    ],
    logs: [
      logItem(orderA.id, "system", "", "pending_assign", "0 元内测订单提交成功"),
      logItem(orderB.id, "admin", "pending_assign", "pending_review", "管理员分配给张老师"),
      logItem(orderC.id, "consultant", "reviewing", "completed", "周老师提交审核报告"),
    ],
  };
}

function makeOrder(input) {
  const submittedAt = input.submittedAt || new Date();
  const pkg = packageMap[input.packageType];
  return {
    id: uid("order"),
    orderNo: input.orderNo || `ORD${dateStamp()}${Math.floor(Math.random() * 900 + 100)}`,
    userPhone: input.student.phone,
    packageType: input.packageType,
    amount: pkg.price,
    paidAmount: 0,
    status: input.status,
    consultantId: input.consultantId || "",
    submittedAt: submittedAt.toISOString(),
    slaDeadline: addHours(submittedAt, pkg.slaHours).toISOString(),
    file: input.file || {
      name: "志愿表.xlsx",
      size: "246 KB",
      preview: sampleRows,
    },
    student: input.student,
    materialNote: "",
    report: null,
    feedbackScore: null,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultState();
  } catch (error) {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function dateStamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function addHours(date, hours) {
  return new Date(new Date(date).getTime() + hours * 60 * 60 * 1000);
}

function addMinutes(date, minutes) {
  return new Date(new Date(date).getTime() + minutes * 60 * 1000);
}

function formatTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function logItem(orderId, actor, fromStatus, toStatus, reason) {
  return {
    id: uid("log"),
    orderId,
    actor,
    fromStatus,
    toStatus,
    reason,
    createdAt: new Date().toISOString(),
  };
}

function statusBadge(status) {
  return `<span class="status ${status}">${statusMap[status] || status}</span>`;
}

function riskBadge(level) {
  const text = { high: "高风险", medium: "中风险", low: "低风险" }[level] || level;
  return `<span class="tag ${level}">${text}</span>`;
}

function maskPhone(phone) {
  return phone ? String(phone).replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2") : "-";
}

function feedbackCategoryName(category) {
  return (
    {
      report_value: "报告价值",
      clarity: "理解成本",
      speed: "交付时效",
      trust: "可信度",
      service: "服务体验",
      other: "其他",
    }[category] || "未分类"
  );
}

function consultantName(id) {
  return state.consultants.find((c) => c.id === id)?.name || "未分配";
}

function setRole(role) {
  state.ui.role = role;
  state.ui.view =
    role === "user" ? "userHome" : role === "admin" ? "adminDashboard" : "consultantBoard";
  saveState();
  render();
}

function setView(view) {
  state.ui.view = view;
  saveState();
  render();
}

function toast(message) {
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2600);
}

function icon(name, size = 17) {
  return `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`;
}

function render() {
  document.querySelector("#app").innerHTML = `
    <div class="app-shell">
      ${renderTopbar()}
      <div class="layout">
        ${renderSidebar()}
        <main class="main">${renderMain()}</main>
      </div>
    </div>
  `;
  wireEvents();
  if (window.lucide) window.lucide.createIcons();
}

function renderTopbar() {
  return `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">${icon("clipboard-check", 20)}</div>
        <div>
          <p class="brand-title">志愿填报专家审核服务</p>
          <p class="brand-subtitle">内测 MVP / PRD v1.1</p>
        </div>
      </div>
      <div class="role-switch" aria-label="切换角色">
        ${roleButton("user", "用户端", "smartphone")}
        ${roleButton("admin", "管理后台", "shield-check")}
        ${roleButton("consultant", "高报师", "briefcase-business")}
      </div>
      <div class="top-actions">
        <span>本地演示数据</span>
        <button class="btn secondary icon-only" id="resetDemo" title="重置演示数据">${icon("rotate-ccw", 16)}</button>
      </div>
    </header>
  `;
}

function roleButton(role, label, iconName) {
  return `
    <button class="role-btn ${state.ui.role === role ? "active" : ""}" data-role="${role}">
      ${icon(iconName)}<span>${label}</span>
    </button>
  `;
}

function renderSidebar() {
  const navs = {
    user: [
      ["userHome", "首页", "home"],
      ["userSubmit", "提交订单", "upload-cloud"],
      ["userOrders", "我的订单", "list-checks"],
      ["userMine", "我的", "user-round"],
    ],
    admin: [
      ["adminDashboard", "仪表盘", "layout-dashboard"],
      ["adminOrders", "订单管理", "table-properties"],
      ["adminConsultants", "高报师管理", "users-round"],
      ["adminCodes", "内测邀请码", "ticket-check"],
      ["adminFeedback", "反馈管理", "message-square-more"],
      ["adminLogs", "操作日志", "scroll-text"],
    ],
    consultant: [
      ["consultantBoard", "任务看板", "kanban-square"],
      ["consultantReview", "审核面板", "file-pen-line"],
      ["consultantStats", "工作统计", "chart-no-axes-combined"],
    ],
  }[state.ui.role];

  return `
    <aside class="sidebar">
      ${navs
        .map(
          ([view, label, iconName]) => `
          <button class="nav-btn ${state.ui.view === view ? "active" : ""}" data-view="${view}">
            ${icon(iconName)}<span>${label}</span>
          </button>
        `,
        )
        .join("")}
    </aside>
  `;
}

function renderMain() {
  const views = {
    userHome: renderUserHome,
    userSubmit: renderUserSubmit,
    userOrders: renderUserOrders,
    userMine: renderUserMine,
    adminDashboard: renderAdminDashboard,
    adminOrders: renderAdminOrders,
    adminConsultants: renderAdminConsultants,
    adminCodes: renderAdminCodes,
    adminFeedback: renderAdminFeedback,
    adminLogs: renderAdminLogs,
    consultantBoard: renderConsultantBoard,
    consultantReview: renderConsultantReview,
    consultantStats: renderConsultantStats,
  };
  return (views[state.ui.view] || renderUserHome)();
}

function renderUserHome() {
  const completed = state.orders.filter((o) => o.status === "completed").length;
  return `
    <section class="banner">
      <div class="banner-copy">
        <span class="eyebrow">${icon("sparkles", 14)}内测专属通道</span>
        <h1>把已完成的志愿表交给专家做风险审核</h1>
        <p>上传志愿表并填写考生信息后，平台分配高报师在承诺时间内完成图文审核报告。内测版重点跑通提交、分配、审核、交付、反馈闭环。</p>
        <div class="banner-actions">
          <button class="btn" data-view="userSubmit">${icon("upload-cloud")}开始提交</button>
          <button class="btn secondary" data-view="userOrders">${icon("file-text")}查看报告</button>
        </div>
      </div>
      <div class="banner-media">
        <img src="./assets/review-workflow.png" alt="专家审核服务流程视觉图" />
      </div>
    </section>
    <section class="grid four mt">
      ${metric("核心流程成功率目标", ">95%", "从资料提交到报告完成")}
      ${metric("平均审核耗时目标", "<45 分钟", "高报师开始处理到提交")}
      ${metric("SLA 交付目标", "12-24 小时", "按套餐计算截止时间")}
      ${metric("已完成报告", `${completed} 份`, "当前演示数据")}
    </section>
    <section class="grid three mt">
      ${infoPanel("资料提交", "上传 .xlsx/.xls 志愿表，填写分数、位次、选科、体检、外语和联系方式。", "upload")}
      ${infoPanel("专家审核", "检查资料完整性、硬性条件、冲稳保梯度、退档滑档风险和用户偏好冲突。", "search-check")}
      ${infoPanel("报告交付", "输出总体评价、风险概览、详细风险清单、调整建议和温馨提示。", "file-check-2")}
    </section>
  `;
}

function metric(label, value, hint) {
  return `
    <div class="panel pad metric">
      <strong>${value}</strong>
      <span>${label}</span>
      <p class="muted">${hint}</p>
    </div>
  `;
}

function infoPanel(title, body, iconName) {
  return `
    <div class="panel pad">
      <div class="panel-title">
        <h3>${title}</h3>
        ${icon(iconName, 20)}
      </div>
      <p class="muted">${body}</p>
    </div>
  `;
}

function renderUserSubmit() {
  const step = state.ui.submitStep;
  return `
    <div class="section-title">
      <div>
        <h2>提交审核订单</h2>
        <p>按 PRD 的四步流程收集材料、考生信息、套餐和确认支付信息。</p>
      </div>
      <button class="btn secondary" id="clearDraft">${icon("eraser")}清空草稿</button>
    </div>
    <div class="panel pad">
      <div class="steps">
        ${["上传志愿表", "填写考生信息", "选择套餐", "确认提交"].map((label, idx) => `
          <div class="step ${step === idx + 1 ? "active" : ""}">${icon(idx < step ? "check" : "circle", 16)}${label}</div>
        `).join("")}
      </div>
      ${step === 1 ? renderUploadStep() : ""}
      ${step === 2 ? renderStudentStep() : ""}
      ${step === 3 ? renderPackageStep() : ""}
      ${step === 4 ? renderConfirmStep() : ""}
    </div>
  `;
}

function renderUploadStep() {
  const d = state.draft;
  return `
    <div class="upload-box">
      <div class="panel-title">
        <div>
          <h3>上传志愿表</h3>
          <p class="muted">内测建议文件不超过 10MB，支持 .xlsx/.xls。演示版会展示前 5 行预览。</p>
        </div>
        ${icon("file-spreadsheet", 24)}
      </div>
      <input id="volunteerFile" type="file" accept=".xlsx,.xls" />
      ${d.fileName ? `<p><strong>${escapeHtml(d.fileName)}</strong> <span class="muted">${escapeHtml(d.fileSize)}</span></p>` : ""}
      ${d.preview.length ? renderPreviewTable(d.preview) : ""}
      <div class="actions">
        <button class="btn" id="stepUploadNext">${icon("arrow-right")}保存并下一步</button>
        <button class="btn secondary" id="mockUpload">${icon("wand-sparkles")}使用示例志愿表</button>
      </div>
    </div>
  `;
}

function renderPreviewTable(rows = sampleRows) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>批次</th><th>序号</th><th>院校代码</th><th>院校</th><th>专业组</th><th>专业</th><th>备注</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderStudentStep() {
  const s = state.draft.student;
  return `
    <div class="form-grid">
      ${field("考生姓名", "studentName", s.name, "text", "可用脱敏昵称")}
      ${selectField("省份", "studentProvince", s.province, provinceOptions)}
      ${field("高考总分", "studentScore", s.score, "number", "0-750")}
      ${field("省内位次", "studentRank", s.rank, "number", "大于 0 的整数")}
      <div class="field full">
        <label>选考科目</label>
        <div class="check-row">
          ${subjectOptions.map((subj) => `
            <label class="pill-check">
              <input type="checkbox" name="subjects" value="${subj}" ${s.subjects.includes(subj) ? "checked" : ""} />
              <span>${subj}</span>
            </label>
          `).join("")}
        </div>
      </div>
      ${selectField("体检结论", "studentMedical", s.medical, ["完全合格", "色弱", "色盲", "视力受限", "其他需说明"])}
      ${selectField("外语语种", "studentLanguage", s.language, ["英语", "日语", "俄语", "其他"])}
      ${field("手机号", "studentPhone", s.phone, "tel", "11 位手机号")}
      ${field("电子邮箱", "studentEmail", s.email, "email", "可选")}
      <div class="field full">
        <label>备注/特殊偏好</label>
        <textarea id="studentPreferences" maxlength="300" placeholder="例如：不接受中外合作，优先省内院校">${escapeHtml(s.preferences)}</textarea>
      </div>
    </div>
    <div class="actions mt">
      <button class="btn secondary" data-step="1">${icon("arrow-left")}上一步</button>
      <button class="btn" id="stepStudentNext">${icon("arrow-right")}保存并下一步</button>
    </div>
  `;
}

function field(label, id, value, type, placeholder) {
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <input id="${id}" type="${type}" value="${escapeHtml(value)}" placeholder="${placeholder || ""}" />
    </div>
  `;
}

function selectField(label, id, value, options) {
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <select id="${id}">
        ${options.map((option) => `<option ${option === value ? "selected" : ""}>${option}</option>`).join("")}
      </select>
    </div>
  `;
}

function renderPackageStep() {
  const d = state.draft;
  const result = d.inviteResult;
  return `
    <div class="grid two">
      ${Object.entries(packageMap).map(([key, pkg]) => `
        <label class="package-option">
          <input type="radio" name="packageType" value="${key}" ${d.packageType === key ? "checked" : ""} />
          <span>
            <strong>${pkg.name} ¥${pkg.price}</strong>
            <span>${pkg.benefits}</span>
          </span>
        </label>
      `).join("")}
    </div>
    <div class="form-grid mt">
      <div class="field">
        <label for="inviteCode">邀请码</label>
        <input id="inviteCode" value="${escapeHtml(d.inviteCode)}" placeholder="例如 TEST2026" />
      </div>
      <div class="field">
        <label>&nbsp;</label>
        <button class="btn secondary" id="verifyInvite">${icon("ticket-check")}校验邀请码</button>
      </div>
    </div>
    ${result ? `<p class="mt ${result.ok ? "tag low" : "tag high"}">${escapeHtml(result.message)}</p>` : ""}
    <div class="actions mt">
      <button class="btn secondary" data-step="2">${icon("arrow-left")}上一步</button>
      <button class="btn" id="stepPackageNext">${icon("arrow-right")}保存并下一步</button>
    </div>
  `;
}

function renderConfirmStep() {
  const d = state.draft;
  const pkg = packageMap[d.packageType];
  const discount = calculateDiscount();
  const paid = Math.max(pkg.price - discount, 0);
  return `
    <div class="grid two">
      <div class="panel pad">
        <div class="panel-title"><h3>订单确认</h3>${statusBadge(paid === 0 ? "pending_assign" : "pending_payment")}</div>
        <div class="summary-list">
          ${summaryItem("套餐", `${pkg.name} / ¥${pkg.price}`)}
          ${summaryItem("抵扣", `¥${discount}`)}
          ${summaryItem("实付", `¥${paid}`)}
          ${summaryItem("SLA", `${pkg.slaHours} 小时内交付`)}
          ${summaryItem("考生", state.draft.student.name || "未填写")}
          ${summaryItem("志愿表", state.draft.fileName || "未上传")}
        </div>
      </div>
      <div class="panel pad">
        <div class="panel-title"><h3>服务提示</h3>${icon("shield-alert", 20)}</div>
        <p class="muted">报告为专家审核建议，仅供参考。最终填报前应再次核对官方招生计划、招生章程、专业限制、填报截止时间和系统确认结果。</p>
        <label class="pill-check mt">
          <input id="agreement" type="checkbox" ${d.agreement ? "checked" : ""} />
          <span>我已阅读并同意服务协议与隐私政策</span>
        </label>
      </div>
    </div>
    <div class="actions mt">
      <button class="btn secondary" data-step="3">${icon("arrow-left")}上一步</button>
      <button class="btn" id="createOrder">${icon(paid === 0 ? "send" : "credit-card")}${paid === 0 ? "0 元确认提交" : "模拟支付并提交"}</button>
    </div>
  `;
}

function summaryItem(label, value) {
  return `<div class="summary-item"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderUserOrders() {
  const filter = state.ui.userOrderFilter || "all";
  const orders = state.orders.filter((o) => filter === "all" || o.status === filter);
  const selected = state.orders.find((o) => o.id === state.ui.selectedOrderId) || orders[0];
  return `
    <div class="section-title">
      <div>
        <h2>我的订单</h2>
        <p>查看订单状态、审核报告、复核入口和反馈入口。</p>
      </div>
    </div>
    <div class="segmented">
      ${["all", "pending_assign", "pending_review", "reviewing", "completed", "pending_material"].map((s) => `
        <button class="seg-btn ${filter === s ? "active" : ""}" data-filter="${s}">${s === "all" ? "全部" : statusMap[s]}</button>
      `).join("")}
    </div>
    <div class="grid two">
      <div class="panel pad">
        <div class="panel-title"><h3>订单列表</h3><span class="muted">${orders.length} 个订单</span></div>
        ${orders.length ? `<div class="table-wrap">${renderOrderTable(orders, "user")}</div>` : `<div class="empty">当前筛选下暂无订单</div>`}
      </div>
      <div class="panel pad">
        ${selected ? renderUserOrderDetail(selected) : `<div class="empty">请选择一个订单查看详情</div>`}
      </div>
    </div>
  `;
}

function renderOrderTable(orders, mode) {
  return `
    <table>
      <thead>
        <tr>
          <th>订单号</th><th>状态</th><th>套餐</th><th>考生</th><th>高报师</th><th>SLA</th><th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map((o) => `
          <tr>
            <td>${o.orderNo}</td>
            <td>${statusBadge(o.status)}</td>
            <td>${packageMap[o.packageType].name}</td>
            <td>${escapeHtml(o.student.name || "匿名")}<br><span class="muted">${o.student.score} 分 / ${o.student.rank} 位</span></td>
            <td>${consultantName(o.consultantId)}</td>
            <td>${formatTime(o.slaDeadline)}</td>
            <td>${renderOrderActions(o, mode)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderOrderActions(o, mode) {
  if (mode === "user") return `<button class="btn secondary" data-select-order="${o.id}">${icon("eye", 15)}详情</button>`;
  if (mode === "admin") {
    return `
      <div class="actions">
        <select data-assign-select="${o.id}">
          <option value="">选择高报师</option>
          ${state.consultants.map((c) => `<option value="${c.id}" ${o.consultantId === c.id ? "selected" : ""}>${c.name} / 负载 ${c.currentLoad}</option>`).join("")}
        </select>
        <button class="btn secondary" data-assign-order="${o.id}">${icon("user-check", 15)}分配</button>
      </div>
    `;
  }
  return `<button class="btn secondary" data-consultant-open="${o.id}">${icon("file-pen-line", 15)}审核</button>`;
}

function renderUserOrderDetail(order) {
  return `
    <div class="panel-title">
      <div>
        <h3>${order.orderNo}</h3>
        <p class="muted">${packageMap[order.packageType].name} / ${formatTime(order.submittedAt)} 提交</p>
      </div>
      ${statusBadge(order.status)}
    </div>
    <div class="summary-list">
      ${summaryItem("当前处理人", consultantName(order.consultantId))}
      ${summaryItem("预计完成", formatTime(order.slaDeadline))}
      ${summaryItem("志愿表", order.file.name)}
      ${summaryItem("考生信息", `${order.student.province} ${order.student.score} 分 / ${order.student.rank} 位`)}
    </div>
    ${order.status === "pending_material" ? `<div class="panel pad mt"><strong>需补充资料</strong><p class="muted">${escapeHtml(order.materialNote)}</p><button class="btn mt" data-supplement="${order.id}">${icon("upload-cloud")}模拟补充资料</button></div>` : ""}
    <div class="mt">
      <h3>状态记录</h3>
      ${renderTimeline(order.id)}
    </div>
    ${order.report ? renderReport(order) : `<div class="empty mt">报告尚未生成。当前状态为 ${statusMap[order.status]}。</div>`}
  `;
}

function renderTimeline(orderId) {
  const logs = state.logs.filter((l) => l.orderId === orderId).slice().reverse();
  if (!logs.length) return `<div class="empty">暂无状态日志</div>`;
  return `<div class="timeline">${logs.map((log) => `
    <div class="timeline-item">
      <span class="dot"></span>
      <div>
        <strong>${log.fromStatus ? statusMap[log.fromStatus] : "创建"} -> ${statusMap[log.toStatus] || log.toStatus}</strong>
        <span>${formatTime(log.createdAt)} / ${escapeHtml(log.actor)} / ${escapeHtml(log.reason)}</span>
      </div>
    </div>
  `).join("")}</div>`;
}

function renderReport(order) {
  const report = order.report;
  const high = report.risks.filter((r) => r.level === "high").length;
  const medium = report.risks.filter((r) => r.level === "medium").length;
  const low = report.risks.filter((r) => r.level === "low").length;
  return `
    <div class="panel pad mt">
      <div class="panel-title">
        <h3>审核报告</h3>
        <span class="muted">${formatTime(report.submittedAt)} 交付</span>
      </div>
      <div class="summary-list">
        ${summaryItem("高风险", `${high} 项`)}
        ${summaryItem("中风险", `${medium} 项`)}
        ${summaryItem("低风险", `${low} 项`)}
        ${summaryItem("语音解读", report.audioNote || "文字报告替代")}
      </div>
      <h3 class="mt">一、总体评价</h3>
      <p class="muted">${escapeHtml(report.summary)}</p>
      <h3 class="mt">二、详细风险清单</h3>
      <div class="risk-list">
        ${report.risks.map((r) => `
          <div class="risk-item">
            <div class="actions"><strong>${escapeHtml(r.position)}</strong>${riskBadge(r.level)}<span class="tag">${escapeHtml(r.type)}</span></div>
            <p class="muted"><strong>问题说明：</strong>${escapeHtml(r.problem)}</p>
            <p class="muted"><strong>专家建议：</strong>${escapeHtml(r.suggestion)}</p>
          </div>
        `).join("")}
      </div>
      <h3 class="mt">三、调整建议</h3>
      <p class="muted">${escapeHtml(report.adjustment)}</p>
      <h3 class="mt">四、温馨提示</h3>
      <p class="muted">请在最终提交前，再次核对官方招生计划、招生章程、专业限制、填报截止时间和系统确认结果。本报告为专家审核建议，不替代官方录取规则。</p>
      <div class="actions mt">
        <button class="btn secondary" data-print-report="${order.id}">${icon("printer")}打印/导出</button>
        <button class="btn secondary" data-copy-report="${order.id}">${icon("copy")}复制报告</button>
        <button class="btn secondary" data-feedback="${order.id}">${icon("message-square-more")}提交反馈</button>
        ${order.packageType === "escort" ? `<button class="btn secondary" data-rereview="${order.id}">${icon("refresh-cw")}申请复核</button>` : ""}
      </div>
    </div>
  `;
}

function renderUserMine() {
  return `
    <div class="section-title">
      <div>
        <h2>我的</h2>
        <p>内测版本保留必要服务信息、协议入口和反馈入口。</p>
      </div>
    </div>
    <div class="grid two">
      <div class="panel pad">
        <div class="panel-title"><h3>账号信息</h3>${icon("user-round", 20)}</div>
        <div class="summary-list">
          ${summaryItem("登录手机号", "138****0000")}
          ${summaryItem("服务类型", "内测邀请用户")}
          ${summaryItem("已提交订单", `${state.orders.length} 单`)}
          ${summaryItem("已完成报告", `${state.orders.filter((o) => o.report).length} 份`)}
        </div>
      </div>
      <div class="panel pad">
        <div class="panel-title"><h3>服务入口</h3>${icon("headphones", 20)}</div>
        <div class="grid">
          <button class="btn secondary">${icon("file-lock-2")}服务协议</button>
          <button class="btn secondary">${icon("shield")}隐私政策</button>
          <button class="btn secondary">${icon("message-circle-question")}联系客服</button>
        </div>
      </div>
    </div>
  `;
}

function renderAdminDashboard() {
  const counts = countStatuses();
  const overdue = state.orders.filter((o) => new Date(o.slaDeadline) < new Date() && !["completed", "closed", "cancelled"].includes(o.status)).length;
  return `
    <div class="section-title">
      <div>
        <h2>运营仪表盘</h2>
        <p>跟踪内测订单承接、分配、审核和交付风险。</p>
      </div>
    </div>
    <section class="grid four">
      ${metric("总订单数", state.orders.length, "含演示与用户新建订单")}
      ${metric("待分配", counts.pending_assign || 0, "需运营处理")}
      ${metric("审核中", (counts.reviewing || 0) + (counts.pending_review || 0), "高报师待办")}
      ${metric("超时预警", overdue, "超过 SLA 未完成")}
    </section>
    <section class="grid two mt">
      <div class="panel pad">
        <div class="panel-title"><h3>状态分布</h3>${icon("chart-column", 20)}</div>
        <div class="risk-list">
          ${Object.entries(statusMap).map(([key, label]) => `
            <div class="risk-item">
              <div class="actions"><strong>${label}</strong><span class="right">${counts[key] || 0} 单</span></div>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="panel pad">
        <div class="panel-title"><h3>运营动作建议</h3>${icon("list-todo", 20)}</div>
        <div class="risk-list">
          <div class="risk-item">待分配订单优先按在线状态、当前负载、擅长领域、平均耗时排序。</div>
          <div class="risk-item">距离 SLA 不足 3 小时的订单需要红色预警并提醒高报师。</div>
          <div class="risk-item">改派订单需填写原因，并写入状态日志，已开始审核的订单需超级管理员确认。</div>
        </div>
      </div>
    </section>
  `;
}

function countStatuses() {
  return state.orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});
}

function renderAdminOrders() {
  const filter = state.ui.adminOrderFilter || "all";
  const orders = state.orders.filter((o) => filter === "all" || o.status === filter);
  return `
    <div class="section-title">
      <div>
        <h2>订单管理</h2>
        <p>人工分配、改派和查看订单状态日志。</p>
      </div>
      <button class="btn secondary" id="exportOrders">${icon("download")}导出演示数据</button>
    </div>
    <div class="segmented">
      ${["all", "pending_assign", "pending_review", "reviewing", "pending_material", "completed"].map((s) => `
        <button class="seg-btn ${filter === s ? "active" : ""}" data-admin-filter="${s}">${s === "all" ? "全部" : statusMap[s]}</button>
      `).join("")}
    </div>
    <div class="panel pad">
      <div class="table-wrap">${renderOrderTable(orders, "admin")}</div>
    </div>
  `;
}

function renderAdminConsultants() {
  return `
    <div class="section-title">
      <div>
        <h2>高报师管理</h2>
        <p>查看专家在线状态、擅长领域、当前负载和历史平均耗时。</p>
      </div>
    </div>
    <div class="grid three">
      ${state.consultants.map((c) => `
        <div class="panel pad">
          <div class="panel-title"><h3>${c.name}</h3><span class="tag ${c.status === "online" ? "low" : ""}">${c.status === "online" ? "在线" : "休息"}</span></div>
          <div class="summary-list">
            ${summaryItem("擅长领域", c.expertise)}
            ${summaryItem("当前负载", `${c.currentLoad} 单`)}
            ${summaryItem("平均耗时", `${c.avgMinutes} 分钟`)}
            ${summaryItem("评分", `${c.rating}/5`)}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderAdminCodes() {
  return `
    <div class="section-title">
      <div>
        <h2>内测邀请码</h2>
        <p>支持全额抵扣、部分抵扣、套餐匹配和使用次数限制。</p>
      </div>
    </div>
    <div class="panel pad">
      <div class="panel-title">
        <h3>生成邀请码</h3>
        <p class="muted">用于内测 0 元单、套餐优惠和渠道来源追踪。</p>
      </div>
      <div class="form-grid compact">
        ${field("邀请码", "newCode", `TEST${Math.floor(Math.random() * 900 + 100)}`, "text", "如 TEST2026")}
        ${field("来源", "newCodeSource", "运营手动生成", "text", "渠道或活动名称")}
        ${selectField("适用套餐", "newCodePackage", "all", ["all", "single", "escort"])}
        ${selectField("抵扣类型", "newCodeDiscountType", "full", ["full", "amount"])}
        ${field("抵扣金额", "newCodeDiscountValue", "100", "number", "固定金额时生效")}
        ${field("最大使用次数", "newCodeMaxUsage", "10", "number", "默认 10")}
        ${field("过期日期", "newCodeExpiredAt", "2026-06-20", "date", "")}
      </div>
      <div class="actions mt">
        <button class="btn" id="createInviteCode">${icon("ticket-plus")}生成邀请码</button>
      </div>
    </div>
    <div class="panel pad">
      <div class="table-wrap">
        <table>
          <thead><tr><th>邀请码</th><th>来源</th><th>适用套餐</th><th>抵扣</th><th>使用次数</th><th>过期时间</th></tr></thead>
          <tbody>
            ${state.inviteCodes.map((c) => `
              <tr>
                <td><strong>${c.code}</strong></td>
                <td>${c.source}</td>
                <td>${c.packageType === "all" ? "全部" : packageMap[c.packageType].name}</td>
                <td>${c.discountType === "full" ? "全额抵扣" : `¥${c.discountValue}`}</td>
                <td>${c.usedCount}/${c.maxUsage}</td>
                <td>${c.expiredAt}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAdminFeedback() {
  const feedbacks = state.feedbacks.slice().reverse();
  const avg = feedbacks.length
    ? (feedbacks.reduce((sum, item) => sum + Number(item.score || 0), 0) / feedbacks.length).toFixed(1)
    : "-";
  const npsYes = feedbacks.filter((item) => item.nps === "yes").length;
  return `
    <div class="section-title">
      <div>
        <h2>反馈管理</h2>
        <p>沉淀满意度、NPS 和报告交付问题，供内测复盘使用。</p>
      </div>
      <button class="btn secondary" id="exportFeedbacks">${icon("download")}导出反馈</button>
    </div>
    <section class="grid four">
      ${metric("反馈数量", feedbacks.length, "报告完成后收集")}
      ${metric("平均满意度", avg, "目标 >8/10")}
      ${metric("愿意推荐", feedbacks.length ? `${Math.round((npsYes / feedbacks.length) * 100)}%` : "-", "NPS 口径")}
      ${metric("待回访", feedbacks.filter((f) => Number(f.score) <= 6).length, "低分优先处理")}
    </section>
    <div class="panel pad mt">
      <div class="table-wrap">
        <table>
          <thead><tr><th>时间</th><th>订单</th><th>用户</th><th>评分</th><th>NPS</th><th>问题分类</th><th>反馈内容</th></tr></thead>
          <tbody>
            ${feedbacks.map((f) => {
              const order = state.orders.find((o) => o.id === f.orderId);
              return `
                <tr>
                  <td>${formatTime(f.createdAt)}</td>
                  <td>${order?.orderNo || f.orderId}</td>
                  <td>${maskPhone(order?.student?.phone || "")}</td>
                  <td><strong>${f.score}/10</strong></td>
                  <td>${f.nps === "yes" ? "愿意推荐" : f.nps === "no" ? "暂不推荐" : "未填写"}</td>
                  <td>${feedbackCategoryName(f.category)}</td>
                  <td>${escapeHtml(f.content || "-")}</td>
                </tr>
              `;
            }).join("") || `<tr><td colspan="7">暂无反馈</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAdminLogs() {
  return `
    <div class="section-title">
      <div>
        <h2>操作日志</h2>
        <p>状态变化、分配、提交报告、资料不足等关键动作均留痕。</p>
      </div>
    </div>
    <div class="panel pad">
      <div class="table-wrap">
        <table>
          <thead><tr><th>时间</th><th>订单</th><th>操作者</th><th>状态变化</th><th>原因</th></tr></thead>
          <tbody>
            ${state.logs.slice().reverse().map((l) => {
              const order = state.orders.find((o) => o.id === l.orderId);
              return `
                <tr>
                  <td>${formatTime(l.createdAt)}</td>
                  <td>${order?.orderNo || l.orderId}</td>
                  <td>${escapeHtml(l.actor)}</td>
                  <td>${l.fromStatus ? statusMap[l.fromStatus] : "创建"} -> ${statusMap[l.toStatus] || l.toStatus}</td>
                  <td>${escapeHtml(l.reason)}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderConsultantBoard() {
  const tasks = state.orders.filter((o) => o.consultantId === "c1" && ["pending_review", "reviewing", "pending_material", "re_reviewing"].includes(o.status));
  return `
    <div class="section-title">
      <div>
        <h2>任务看板</h2>
        <p>高报师仅可查看管理员分配给自己的订单。</p>
      </div>
    </div>
    <div class="grid four">
      ${metric("待处理", tasks.filter((o) => o.status === "pending_review").length, "等待开始处理")}
      ${metric("进行中", tasks.filter((o) => o.status === "reviewing").length, "草稿自动保存")}
      ${metric("资料不足", tasks.filter((o) => o.status === "pending_material").length, "等待用户补充")}
      ${metric("平均耗时", "38 分钟", "演示专家张老师")}
    </div>
    <div class="panel pad mt">
      <div class="panel-title"><h3>我的待办</h3><span class="muted">${tasks.length} 单</span></div>
      ${tasks.length ? `<div class="table-wrap">${renderOrderTable(tasks, "consultant")}</div>` : `<div class="empty">当前暂无分配任务</div>`}
    </div>
  `;
}

function renderConsultantReview() {
  const orders = state.orders.filter((o) => o.consultantId === "c1");
  const selected = state.orders.find((o) => o.id === state.ui.consultantOrderId) || orders[0];
  if (!selected) {
    return `<div class="empty">暂无分配给张老师的订单。可先在管理后台分配订单。</div>`;
  }
  const draft = getReviewDraft(selected.id);
  return `
    <div class="section-title">
      <div>
        <h2>审核面板</h2>
        <p>四区工作台：考生摘要、原始志愿表预览、审核工具、报告制作区。</p>
      </div>
      <select id="consultantOrderPicker">
        ${orders.map((o) => `<option value="${o.id}" ${o.id === selected.id ? "selected" : ""}>${o.orderNo} / ${statusMap[o.status]}</option>`).join("")}
      </select>
    </div>
    <div class="review-grid">
      <div class="review-stack">
        <div class="panel pad">
          <div class="panel-title">
            <h3>考生信息摘要</h3>
            ${statusBadge(selected.status)}
          </div>
          <div class="summary-list">
            ${summaryItem("姓名", selected.student.name || "匿名")}
            ${summaryItem("省份", selected.student.province)}
            ${summaryItem("分数/位次", `${selected.student.score} / ${selected.student.rank}`)}
            ${summaryItem("选科", selected.student.subjects.join("、"))}
            ${summaryItem("体检", selected.student.medical)}
            ${summaryItem("外语", selected.student.language)}
            ${summaryItem("SLA", formatTime(selected.slaDeadline))}
            ${summaryItem("偏好", selected.student.preferences || "未填写")}
          </div>
          <div class="actions mt">
            <button class="btn" data-start-review="${selected.id}" ${selected.status !== "pending_review" ? "disabled" : ""}>${icon("play")}开始处理</button>
            <button class="btn secondary" data-save-draft="${selected.id}">${icon("save")}保存草稿</button>
            <button class="btn warn" data-material="${selected.id}" ${selected.status !== "reviewing" ? "disabled" : ""}>${icon("circle-alert")}资料不足</button>
          </div>
        </div>
        <div class="panel pad">
          <div class="panel-title"><h3>原始志愿表预览</h3>${icon("search", 20)}</div>
          <div class="volunteer-preview">${renderPreviewTable(selected.file.preview)}</div>
        </div>
        <div class="panel pad">
          <div class="panel-title"><h3>审核清单</h3>${icon("list-checks", 20)}</div>
          <div class="risk-list">
            ${["资料完整性", "批次与代码", "硬性条件", "冲稳保梯度", "退档与滑档", "用户偏好冲突", "报告复核"].map((item, index) => `
              <label class="pill-check">
                <input type="checkbox" ${draft.checklist?.includes(item) ? "checked" : ""} data-checklist="${item}" />
                <span>${index + 1}. ${item}</span>
              </label>
            `).join("")}
          </div>
        </div>
      </div>
      <div class="review-stack">
        <div class="panel pad">
          <div class="panel-title"><h3>风险点管理</h3>${icon("shield-alert", 20)}</div>
          <div class="form-grid">
            ${selectField("风险等级", "riskLevel", "high", ["high", "medium", "low"])}
            ${selectField("风险类型", "riskType", riskTypes[0], riskTypes)}
            ${field("位置", "riskPosition", "", "text", "如：本科批 / 第 3 志愿")}
            ${field("问题说明", "riskProblem", "", "text", "为什么是风险")}
            <div class="field full">
              <label>专家建议</label>
              <textarea id="riskSuggestion" placeholder="应当怎么改"></textarea>
            </div>
          </div>
          <div class="actions mt">
            <button class="btn secondary" data-add-risk="${selected.id}">${icon("plus")}添加风险点</button>
          </div>
          <div class="risk-list mt">
            ${(draft.risks || []).map((r) => `
              <div class="risk-item">
                <div class="actions"><strong>${escapeHtml(r.position)}</strong>${riskBadge(r.level)}<span class="tag">${escapeHtml(r.type)}</span><button class="btn secondary icon-only right" title="删除风险" data-remove-risk="${selected.id}:${r.id}">${icon("trash-2", 15)}</button></div>
                <p class="muted">${escapeHtml(r.problem)}</p>
                <p class="muted">${escapeHtml(r.suggestion)}</p>
              </div>
            `).join("") || `<div class="empty">尚未添加风险点。若未发现明显高风险，也需要明确写入总体评价。</div>`}
          </div>
        </div>
        <div class="panel pad">
          <div class="panel-title"><h3>报告制作区</h3><span class="muted">每 30 秒自动保存草稿</span></div>
          <div class="field">
            <label>总体评价</label>
            <textarea id="reportSummary" placeholder="整体属于可用/基本可用/风险较高/不建议直接提交">${escapeHtml(draft.summary || "")}</textarea>
          </div>
          <div class="field mt">
            <label>调整建议</label>
            <textarea id="reportAdjustment" placeholder="至少给出一个可执行调整方向">${escapeHtml(draft.adjustment || "")}</textarea>
          </div>
          <div class="field mt">
            <label>语音说明</label>
            <input id="audioNote" value="${escapeHtml(draft.audioNote || "")}" placeholder="例如：已录制 3 分 40 秒语音解读" />
          </div>
          <div class="actions mt">
            <button class="btn secondary" data-save-draft="${selected.id}">${icon("save")}保存草稿</button>
            <button class="btn" data-submit-report="${selected.id}" ${selected.status !== "reviewing" ? "disabled" : ""}>${icon("send")}提交报告</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getReviewDraft(orderId) {
  if (!state.reviewDrafts[orderId]) {
    state.reviewDrafts[orderId] = {
      checklist: [],
      risks: [],
      summary: "",
      adjustment: "",
      audioNote: "",
      updatedAt: "",
    };
  }
  return state.reviewDrafts[orderId];
}

function renderConsultantStats() {
  const done = state.orders.filter((o) => o.consultantId === "c1" && o.status === "completed").length;
  return `
    <div class="section-title">
      <div>
        <h2>工作统计</h2>
        <p>内测版本用于验证单单审核耗时和按时交付率。</p>
      </div>
    </div>
    <div class="grid four">
      ${metric("今日完成", done, "张老师")}
      ${metric("平均耗时", "38 分钟", "目标 <45 分钟")}
      ${metric("超时数", "0", "距离 SLA 不足 3 小时预警")}
      ${metric("满意度", "9.2/10", "报告完成后反馈")}
    </div>
  `;
}

function wireEvents() {
  document.querySelectorAll("[data-role]").forEach((btn) => {
    btn.addEventListener("click", () => setRole(btn.dataset.role));
  });
  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });
  document.querySelectorAll("[data-step]").forEach((btn) => {
    btn.addEventListener("click", () => {
      collectDraftInputs();
      state.ui.submitStep = Number(btn.dataset.step);
      saveState();
      render();
    });
  });
  document.querySelector("#resetDemo")?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    saveState();
    render();
    toast("演示数据已重置");
  });
  document.querySelector("#clearDraft")?.addEventListener("click", () => {
    state.draft = defaultState().draft;
    state.ui.submitStep = 1;
    saveState();
    render();
    toast("订单草稿已清空");
  });
  document.querySelector("#volunteerFile")?.addEventListener("change", onFileChange);
  document.querySelector("#mockUpload")?.addEventListener("click", () => {
    state.draft.fileName = "内测示例志愿表.xlsx";
    state.draft.fileSize = "246 KB";
    state.draft.preview = sampleRows;
    saveState();
    render();
  });
  document.querySelector("#stepUploadNext")?.addEventListener("click", () => {
    if (!state.draft.fileName) return toast("请先上传志愿表或使用示例志愿表");
    state.ui.submitStep = 2;
    saveState();
    render();
  });
  document.querySelector("#stepStudentNext")?.addEventListener("click", () => {
    collectDraftInputs();
    const err = validateStudent();
    if (err) return toast(err);
    state.ui.submitStep = 3;
    saveState();
    render();
  });
  document.querySelectorAll("input[name='packageType']").forEach((radio) => {
    radio.addEventListener("change", () => {
      state.draft.packageType = radio.value;
      state.draft.inviteResult = null;
      saveState();
      render();
    });
  });
  document.querySelector("#verifyInvite")?.addEventListener("click", () => {
    collectDraftInputs();
    verifyInvite();
    saveState();
    render();
  });
  document.querySelector("#stepPackageNext")?.addEventListener("click", () => {
    collectDraftInputs();
    state.ui.submitStep = 4;
    saveState();
    render();
  });
  document.querySelector("#createOrder")?.addEventListener("click", createOrderFromDraft);
  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.ui.userOrderFilter = btn.dataset.filter;
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-admin-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.ui.adminOrderFilter = btn.dataset.adminFilter;
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-select-order]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.ui.selectedOrderId = btn.dataset.selectOrder;
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-assign-order]").forEach((btn) => {
    btn.addEventListener("click", () => assignOrder(btn.dataset.assignOrder));
  });
  document.querySelector("#exportOrders")?.addEventListener("click", exportOrders);
  document.querySelector("#exportFeedbacks")?.addEventListener("click", exportFeedbacks);
  document.querySelector("#createInviteCode")?.addEventListener("click", createInviteCode);
  document.querySelectorAll("[data-consultant-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.ui.consultantOrderId = btn.dataset.consultantOpen;
      setView("consultantReview");
    });
  });
  document.querySelector("#consultantOrderPicker")?.addEventListener("change", (event) => {
    collectReviewDraft(event.target.value);
    state.ui.consultantOrderId = event.target.value;
    saveState();
    render();
  });
  document.querySelectorAll("[data-start-review]").forEach((btn) => {
    btn.addEventListener("click", () => startReview(btn.dataset.startReview));
  });
  document.querySelectorAll("[data-save-draft]").forEach((btn) => {
    btn.addEventListener("click", () => {
      collectReviewDraft(btn.dataset.saveDraft);
      saveState();
      toast("审核草稿已保存");
    });
  });
  document.querySelectorAll("[data-add-risk]").forEach((btn) => {
    btn.addEventListener("click", () => addRisk(btn.dataset.addRisk));
  });
  document.querySelectorAll("[data-remove-risk]").forEach((btn) => {
    btn.addEventListener("click", () => removeRisk(btn.dataset.removeRisk));
  });
  document.querySelectorAll("[data-submit-report]").forEach((btn) => {
    btn.addEventListener("click", () => submitReport(btn.dataset.submitReport));
  });
  document.querySelectorAll("[data-material]").forEach((btn) => {
    btn.addEventListener("click", () => markMaterialNeeded(btn.dataset.material));
  });
  document.querySelectorAll("[data-supplement]").forEach((btn) => {
    btn.addEventListener("click", () => supplementMaterial(btn.dataset.supplement));
  });
  document.querySelectorAll("[data-feedback]").forEach((btn) => {
    btn.addEventListener("click", () => submitFeedback(btn.dataset.feedback));
  });
  document.querySelectorAll("[data-print-report]").forEach((btn) => {
    btn.addEventListener("click", () => printReport(btn.dataset.printReport));
  });
  document.querySelectorAll("[data-copy-report]").forEach((btn) => {
    btn.addEventListener("click", () => copyReportText(btn.dataset.copyReport));
  });
  document.querySelectorAll("[data-rereview]").forEach((btn) => {
    btn.addEventListener("click", () => requestReReview(btn.dataset.rereview));
  });
}

function onFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  const ok = /\.(xlsx|xls)$/i.test(file.name);
  if (!ok) return toast("仅支持 .xlsx/.xls 文件");
  if (file.size > 10 * 1024 * 1024) return toast("文件超过 10MB，请压缩或联系客服");
  state.draft.fileName = file.name;
  state.draft.fileSize = `${Math.max(1, Math.round(file.size / 1024))} KB`;
  state.draft.preview = sampleRows;
  saveState();
  render();
}

function collectDraftInputs() {
  const d = state.draft;
  const student = d.student;
  const val = (id) => document.querySelector(`#${id}`)?.value ?? "";
  if (document.querySelector("#studentName")) {
    student.name = val("studentName").trim();
    student.province = val("studentProvince");
    student.score = val("studentScore");
    student.rank = val("studentRank");
    student.medical = val("studentMedical");
    student.language = val("studentLanguage");
    student.phone = val("studentPhone").trim();
    student.email = val("studentEmail").trim();
    student.preferences = val("studentPreferences").trim();
    student.subjects = [...document.querySelectorAll("input[name='subjects']:checked")].map((i) => i.value);
  }
  if (document.querySelector("input[name='packageType']:checked")) {
    d.packageType = document.querySelector("input[name='packageType']:checked").value;
  }
  if (document.querySelector("#inviteCode")) {
    d.inviteCode = val("inviteCode").trim().toUpperCase();
  }
  if (document.querySelector("#agreement")) {
    d.agreement = document.querySelector("#agreement").checked;
  }
}

function validateStudent() {
  const s = state.draft.student;
  const score = Number(s.score);
  const rank = Number(s.rank);
  if (!score || score < 0 || score > 750) return "高考总分需为 0-750 的数字";
  if (!Number.isInteger(rank) || rank <= 0) return "省内位次需为大于 0 的整数";
  if (!s.subjects.length) return "请至少选择 1 个选考科目";
  if (!/^1\d{10}$/.test(s.phone)) return "请输入 11 位手机号";
  if (s.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) return "电子邮箱格式不正确";
  return "";
}

function verifyInvite() {
  const code = state.draft.inviteCode;
  if (!code) {
    state.draft.inviteResult = { ok: false, message: "请输入邀请码" };
    return;
  }
  const found = state.inviteCodes.find((c) => c.code === code);
  if (!found) {
    state.draft.inviteResult = { ok: false, message: "邀请码不存在、已使用或已过期" };
    return;
  }
  const expired = new Date(found.expiredAt) < new Date();
  const packageMismatch = found.packageType !== "all" && found.packageType !== state.draft.packageType;
  const usageExceeded = found.usedCount >= found.maxUsage;
  if (expired || packageMismatch || usageExceeded) {
    state.draft.inviteResult = { ok: false, message: "邀请码已过期、使用次数已满或与套餐不匹配" };
    return;
  }
  const discount = found.discountType === "full" ? packageMap[state.draft.packageType].price : found.discountValue;
  state.draft.inviteResult = { ok: true, message: `邀请码有效，可抵扣 ¥${discount}` };
}

function calculateDiscount() {
  const result = state.draft.inviteResult;
  if (!result?.ok) return 0;
  const code = state.inviteCodes.find((c) => c.code === state.draft.inviteCode);
  if (!code) return 0;
  return Math.min(packageMap[state.draft.packageType].price, code.discountType === "full" ? 99999 : code.discountValue);
}

function createOrderFromDraft() {
  collectDraftInputs();
  const err = validateStudent();
  if (err) return toast(err);
  if (!state.draft.fileName) return toast("请先上传志愿表");
  if (!state.draft.agreement) return toast("请先同意服务协议与隐私政策");
  const pkg = packageMap[state.draft.packageType];
  const discount = calculateDiscount();
  const paid = Math.max(pkg.price - discount, 0);
  const order = makeOrder({
    status: "pending_assign",
    packageType: state.draft.packageType,
    student: { ...state.draft.student, score: Number(state.draft.student.score), rank: Number(state.draft.student.rank) },
    file: {
      name: state.draft.fileName,
      size: state.draft.fileSize,
      preview: state.draft.preview.length ? state.draft.preview : sampleRows,
    },
    submittedAt: new Date(),
  });
  order.amount = pkg.price;
  order.paidAmount = paid;
  state.orders.unshift(order);
  state.logs.push(logItem(order.id, "user", "", "pending_assign", paid === 0 ? "0 元订单确认提交" : "模拟支付成功并提交"));
  if (state.draft.inviteResult?.ok) {
    const invite = state.inviteCodes.find((c) => c.code === state.draft.inviteCode);
    if (invite) invite.usedCount += 1;
  }
  state.draft = defaultState().draft;
  state.ui.submitStep = 1;
  state.ui.selectedOrderId = order.id;
  state.ui.view = "userOrders";
  saveState();
  render();
  toast("订单已生成，等待管理员分配高报师");
}

function assignOrder(orderId) {
  const select = document.querySelector(`[data-assign-select="${orderId}"]`);
  const consultantId = select?.value;
  if (!consultantId) return toast("请选择高报师");
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return;
  const from = order.status;
  order.consultantId = consultantId;
  order.status = "pending_review";
  state.logs.push(logItem(order.id, "admin", from, "pending_review", `分配给${consultantName(consultantId)}`));
  recalcConsultantLoads();
  saveState();
  render();
  toast("订单已分配，高报师端可见");
}

function recalcConsultantLoads() {
  state.consultants.forEach((c) => {
    c.currentLoad = state.orders.filter((o) => o.consultantId === c.id && !["completed", "closed", "cancelled"].includes(o.status)).length;
  });
}

function exportOrders() {
  const rows = state.orders.map((o) => ({
    orderNo: o.orderNo,
    status: statusMap[o.status],
    package: packageMap[o.packageType].name,
    consultant: consultantName(o.consultantId),
    score: o.student.score,
    rank: o.student.rank,
    slaDeadline: o.slaDeadline,
  }));
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "orders-demo-export.json";
  a.click();
  URL.revokeObjectURL(url);
  toast("已导出演示订单数据");
}

function exportFeedbacks() {
  const rows = state.feedbacks.map((f) => {
    const order = state.orders.find((o) => o.id === f.orderId);
    return {
      orderNo: order?.orderNo || f.orderId,
      phone: maskPhone(order?.student?.phone || ""),
      score: f.score,
      nps: f.nps || "",
      category: feedbackCategoryName(f.category),
      content: f.content || "",
      createdAt: f.createdAt,
    };
  });
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "feedbacks-demo-export.json";
  a.click();
  URL.revokeObjectURL(url);
  toast("已导出反馈数据");
}

function createInviteCode() {
  const get = (id) => document.querySelector(`#${id}`)?.value.trim();
  const code = (get("newCode") || "").toUpperCase();
  if (!/^[A-Z0-9]{4,16}$/.test(code)) return toast("邀请码需为 4-16 位英文或数字");
  if (state.inviteCodes.some((item) => item.code === code)) return toast("邀请码已存在");
  const maxUsage = Number(get("newCodeMaxUsage"));
  const discountValue = Number(get("newCodeDiscountValue"));
  if (!Number.isInteger(maxUsage) || maxUsage <= 0) return toast("最大使用次数需为正整数");
  if (get("newCodeDiscountType") === "amount" && (!discountValue || discountValue <= 0)) return toast("固定金额抵扣需填写正数");
  state.inviteCodes.unshift({
    code,
    packageType: get("newCodePackage") || "all",
    discountType: get("newCodeDiscountType") || "full",
    discountValue: discountValue || 0,
    maxUsage,
    usedCount: 0,
    expiredAt: get("newCodeExpiredAt") || "2026-06-20",
    source: get("newCodeSource") || "运营手动生成",
  });
  saveState();
  render();
  toast("邀请码已生成");
}

function reportText(order) {
  if (!order?.report) return "";
  const report = order.report;
  const high = report.risks.filter((r) => r.level === "high").length;
  const medium = report.risks.filter((r) => r.level === "medium").length;
  const low = report.risks.filter((r) => r.level === "low").length;
  const risks = report.risks
    .map(
      (r, index) =>
        `${index + 1}. 【${r.position}】\n风险等级：${{ high: "高", medium: "中", low: "低" }[r.level] || r.level}\n风险类型：${r.type}\n问题说明：${r.problem}\n专家建议：${r.suggestion}`,
    )
    .join("\n\n");
  return `志愿填报专家审核报告

订单号：${order.orderNo}
考生：${order.student.name || "匿名"} / ${order.student.province} / ${order.student.score} 分 / ${order.student.rank} 位
套餐：${packageMap[order.packageType].name}
交付时间：${formatTime(report.submittedAt)}

一、总体评价
${report.summary}

二、风险概览
高风险：${high} 项；中风险：${medium} 项；低风险：${low} 项

三、详细风险清单
${risks}

四、调整建议
${report.adjustment}

五、温馨提示
请在最终提交前，再次核对官方招生计划、招生章程、专业限制、填报截止时间和系统确认结果。本报告为专家审核建议，不替代官方录取规则。`;
}

function printReport(orderId) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order?.report) return toast("报告尚未生成");
  const win = window.open("", "_blank", "width=960,height=720");
  if (!win) return toast("浏览器阻止了打印窗口，请允许弹窗后重试");
  win.document.write(`
    <!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <title>${order.orderNo} 审核报告</title>
        <style>
          body{font-family:"Microsoft YaHei",Arial,sans-serif;line-height:1.75;color:#172023;margin:32px;}
          h1{font-size:24px;margin:0 0 12px;} h2{font-size:18px;margin:24px 0 8px;}
          .meta{color:#667579;margin-bottom:20px}.risk{border:1px solid #dce6e5;border-radius:8px;padding:12px;margin:10px 0}
          .disclaimer{margin-top:24px;color:#667579;font-size:13px}
        </style>
      </head>
      <body>${renderPrintableReport(order)}</body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

function renderPrintableReport(order) {
  const report = order.report;
  const high = report.risks.filter((r) => r.level === "high").length;
  const medium = report.risks.filter((r) => r.level === "medium").length;
  const low = report.risks.filter((r) => r.level === "low").length;
  return `
    <h1>志愿填报专家审核报告</h1>
    <div class="meta">订单号：${escapeHtml(order.orderNo)} ｜ ${escapeHtml(order.student.province)} ｜ ${escapeHtml(order.student.score)} 分 / ${escapeHtml(order.student.rank)} 位 ｜ ${formatTime(report.submittedAt)} 交付</div>
    <h2>一、总体评价</h2>
    <p>${escapeHtml(report.summary)}</p>
    <h2>二、风险概览</h2>
    <p>高风险：${high} 项；中风险：${medium} 项；低风险：${low} 项</p>
    <h2>三、详细风险清单</h2>
    ${report.risks.map((r, index) => `
      <div class="risk">
        <strong>${index + 1}. ${escapeHtml(r.position)}</strong>
        <p>风险等级：${escapeHtml({ high: "高", medium: "中", low: "低" }[r.level] || r.level)}；风险类型：${escapeHtml(r.type)}</p>
        <p>问题说明：${escapeHtml(r.problem)}</p>
        <p>专家建议：${escapeHtml(r.suggestion)}</p>
      </div>
    `).join("")}
    <h2>四、调整建议</h2>
    <p>${escapeHtml(report.adjustment)}</p>
    <p class="disclaimer">请在最终提交前，再次核对官方招生计划、招生章程、专业限制、填报截止时间和系统确认结果。本报告为专家审核建议，不替代官方录取规则。</p>
  `;
}

async function copyReportText(orderId) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order?.report) return toast("报告尚未生成");
  const text = reportText(order);
  try {
    await navigator.clipboard.writeText(text);
    toast("报告文本已复制");
  } catch (error) {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    toast("报告文本已复制");
  }
}

function startReview(orderId) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order || order.status !== "pending_review") return;
  order.status = "reviewing";
  state.logs.push(logItem(order.id, "consultant", "pending_review", "reviewing", "高报师点击开始处理"));
  saveState();
  render();
  toast("订单已进入审核中");
}

function collectReviewDraft(orderId) {
  if (!orderId || !document.querySelector("#reportSummary")) return;
  const draft = getReviewDraft(orderId);
  draft.summary = document.querySelector("#reportSummary")?.value.trim() || "";
  draft.adjustment = document.querySelector("#reportAdjustment")?.value.trim() || "";
  draft.audioNote = document.querySelector("#audioNote")?.value.trim() || "";
  draft.checklist = [...document.querySelectorAll("[data-checklist]:checked")].map((i) => i.dataset.checklist);
  draft.updatedAt = new Date().toISOString();
}

function addRisk(orderId) {
  collectReviewDraft(orderId);
  const level = document.querySelector("#riskLevel")?.value;
  const type = document.querySelector("#riskType")?.value;
  const position = document.querySelector("#riskPosition")?.value.trim();
  const problem = document.querySelector("#riskProblem")?.value.trim();
  const suggestion = document.querySelector("#riskSuggestion")?.value.trim();
  if (!position || !problem || !suggestion) return toast("风险点需包含位置、问题说明和专家建议");
  const draft = getReviewDraft(orderId);
  draft.risks.push({ id: uid("risk"), level, type, position, problem, suggestion });
  draft.updatedAt = new Date().toISOString();
  saveState();
  render();
  toast("风险点已添加");
}

function removeRisk(payload) {
  const [orderId, riskId] = payload.split(":");
  const draft = getReviewDraft(orderId);
  draft.risks = draft.risks.filter((r) => r.id !== riskId);
  saveState();
  render();
}

function submitReport(orderId) {
  collectReviewDraft(orderId);
  const order = state.orders.find((o) => o.id === orderId);
  const draft = getReviewDraft(orderId);
  if (!order || order.status !== "reviewing") return;
  if (!draft.summary) return toast("未填写总体评价，不能提交报告");
  if (!draft.risks.length) return toast("请至少添加一个风险点，或在风险清单中明确记录未发现明显高风险");
  if (!draft.adjustment) return toast("请填写调整建议");
  order.report = {
    summary: draft.summary,
    adjustment: draft.adjustment,
    audioNote: draft.audioNote,
    risks: draft.risks,
    submittedAt: new Date().toISOString(),
  };
  order.status = "completed";
  state.logs.push(logItem(order.id, "consultant", "reviewing", "completed", "提交审核报告，用户端同步可见"));
  recalcConsultantLoads();
  saveState();
  render();
  toast("报告已提交，用户端可查看");
}

function markMaterialNeeded(orderId) {
  const note = prompt("请输入需要用户补充的资料说明：");
  if (!note?.trim()) return toast("资料不足说明不能为空");
  const order = state.orders.find((o) => o.id === orderId);
  if (!order || order.status !== "reviewing") return;
  order.materialNote = note.trim();
  order.status = "pending_material";
  state.logs.push(logItem(order.id, "consultant", "reviewing", "pending_material", note.trim()));
  recalcConsultantLoads();
  saveState();
  render();
  toast("已同步为待补充资料");
}

function supplementMaterial(orderId) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return;
  const from = order.status;
  order.status = "pending_review";
  order.materialNote = "";
  state.logs.push(logItem(order.id, "user", from, "pending_review", "用户模拟补充资料并重新提交"));
  recalcConsultantLoads();
  saveState();
  render();
  toast("资料已补充，订单回到待审核");
}

function submitFeedback(orderId) {
  const score = prompt("请输入满意度评分 1-10：", "9");
  const value = Number(score);
  if (!value || value < 1 || value > 10) return toast("评分需为 1-10");
  const nps = confirm("你愿意把这个审核服务推荐给其他家长吗？") ? "yes" : "no";
  const categoryInput = prompt("请选择问题分类：报告价值/理解成本/交付时效/可信度/服务体验/其他", "报告价值") || "其他";
  const category =
    {
      报告价值: "report_value",
      理解成本: "clarity",
      交付时效: "speed",
      可信度: "trust",
      服务体验: "service",
      其他: "other",
    }[categoryInput.trim()] || "other";
  const content = prompt("请补充一句反馈：", "报告解释清楚，调整建议可执行。") || "";
  state.feedbacks.push({ id: uid("fb"), orderId, score: value, nps, category, content, createdAt: new Date().toISOString() });
  const order = state.orders.find((o) => o.id === orderId);
  if (order) order.feedbackScore = value;
  saveState();
  render();
  toast("感谢反馈，已进入后台反馈表");
}

function requestReReview(orderId) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order || order.packageType !== "escort") return;
  order.status = "re_reviewing";
  state.logs.push(logItem(order.id, "user", "completed", "re_reviewing", "用户申请全程套餐复核"));
  saveState();
  render();
  toast("已申请复核，高报师端将继续处理");
}

setInterval(() => {
  if (state.ui.role === "consultant" && state.ui.view === "consultantReview" && state.ui.consultantOrderId) {
    collectReviewDraft(state.ui.consultantOrderId);
    saveState();
  }
}, 30000);

render();
