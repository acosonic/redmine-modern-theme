# Local test data for theme development (development DB only).
abort "development only" unless Rails.env.development?
srand(7)
Setting.default_language = 'en'
Setting.ui_theme = 'redmine-modern-theme'
Setting.gravatar_enabled = '0'
Setting.rest_api_enabled = '1'
Setting.text_formatting = 'common_mark'

admin = User.find_by(login: 'admin') || User.new(firstname: 'Redmine', lastname: 'Admin', mail: 'admin@example.test')
admin.login = 'admin'
admin.admin = true
admin.password = admin.password_confirmation = 'admin1234'
admin.must_change_passwd = false
admin.language = 'en'
admin.save!
User.current = admin

people = [%w[Ana Kovač], %w[Marko Petrović], %w[Jelena Ilić], %w[Stefan Đorđević], %w[Mila Šarić],
          %w[Omar Haddad], %w[Lucía Fernández], %w[Wei Zhang]]
users = people.each_with_index.map do |(f, l), i|
  u = User.find_or_initialize_by(login: "user#{i + 1}")
  u.assign_attributes(firstname: f, lastname: l, mail: "user#{i + 1}@example.test", language: 'en')
  u.password = u.password_confirmation = 'password1234'
  u.save!
  u
end

roles = Role.givable.to_a
trackers = Tracker.all.to_a
statuses = IssueStatus.all.to_a
priorities = IssuePriority.all.to_a
activities = TimeEntryActivity.all.to_a

cf = IssueCustomField.find_or_initialize_by(name: 'Platforms')
cf.assign_attributes(field_format: 'list', multiple: true, edit_tag_style: 'check_box',
                     possible_values: %w[Web iOS Android Desktop], is_for_all: true, tracker_ids: trackers.map(&:id))
cf.save!

defs = [
  ['Atlas Platform', 'atlas', nil, 'Core platform services: authentication, billing and the public API. Everything else depends on this.'],
  ['Atlas API', 'atlas-api', 'atlas', 'REST and webhook surface of the platform.'],
  ['Atlas Billing', 'atlas-billing', 'atlas', 'Invoices, subscriptions, payment providers.'],
  ['Mobile Apps', 'mobile', nil, 'iOS and Android clients.'],
  ['Website Redesign', 'website', nil, 'Marketing site relaunch with a new design system, CMS migration and a long description that should be clamped on the project board because nobody reads four lines of text in a card.'],
  ['Internal Tools', 'tools', nil, 'Scripts, dashboards and admin panels.'],
  ['Customer Support', 'support', nil, ''],
  ['Data Warehouse', 'dwh', 'tools', 'ETL jobs and reporting.'],
]
projects = {}
defs.each do |name, ident, parent, desc|
  p = Project.find_or_initialize_by(identifier: ident)
  p.assign_attributes(name: name, description: desc, is_public: ident != 'atlas-billing',
                      tracker_ids: trackers.map(&:id),
                      enabled_module_names: %w[issue_tracking time_tracking news documents files wiki repository boards calendar gantt])
  p.save!
  p.set_parent!(projects[parent]) if parent
  projects[ident] = p
  users.sample(5).each_with_index do |u, i|
    next if Member.exists?(project: p, user: u)
    Member.create!(project: p, user: u, roles: [roles[i % roles.size]])
  end
  Member.create!(project: p, user: admin, roles: [roles.first]) unless Member.exists?(project: p, user: admin)
end

subjects = [
  'Login fails with SSO when the session cookie has expired', 'Add CSV export to the invoices list',
  'Dashboard charts render blank on Safari', 'Rate limiting for the public API', 'Upgrade PostgreSQL to 17',
  'Dark mode: unreadable text in tooltips', 'Password reset e-mail lands in spam', 'Refactor payment provider adapters',
  'Push notifications arrive twice on Android', 'Translate onboarding screens to Serbian',
  'Email Program Remediation Plan: Template Rebuild, Sending Infrastructure, List Warm-Up & Launch Gate',
  'Search results ignore diacritics (č, ć, š, ž, đ)', 'Webhook retries with exponential backoff',
  'Nightly ETL job times out on large tenants', 'Accessibility audit of the checkout flow',
  'Image upload crashes with HEIC files', 'Document the deployment runbook', 'Add 2FA recovery codes',
  'Slow query on the activity page', 'Support ticket auto-assignment rules',
]

if Issue.count < 90
  projects.each_value do |p|
    v = %w[1.0 1.1 2.0].each_with_index.map do |n, i|
      Version.find_or_create_by!(project: p, name: n) do |x|
        x.effective_date = Date.today + (i - 1) * 30
        x.status = i.zero? ? 'closed' : 'open'
        x.description = "Release #{n}"
      end
    end
    members = p.users.to_a
    12.times do |i|
      start = Date.today - rand(40) + 5
      issue = Issue.new(project: p, tracker: trackers.sample, author: members.sample,
                        subject: subjects.sample + (rand < 0.3 ? " (#{p.name})" : ''),
                        description: "Steps to reproduce:\n\n1. Open the page\n2. Click **Save**\n3. See the error\n\n```ruby\ndef retry_later(job, attempts: 3)\n  job.perform_in(2**attempts) # seconds\nend\n```\n\n> Expected: it works.\n\n| Browser | Result |\n|---|---|\n| Firefox | ok |\n| Safari | fails |\n",
                        priority: priorities.sample, status: statuses.first,
                        assigned_to: rand < 0.8 ? members.sample : nil,
                        fixed_version: rand < 0.6 ? v[1..].sample : nil,
                        start_date: start, due_date: start + rand(3..25),
                        estimated_hours: [2, 4, 8, 16, nil].sample, done_ratio: [0, 10, 30, 50, 80, 100].sample,
                        is_private: rand < 0.1)
      issue.custom_field_values = { cf.id => %w[Web iOS Android Desktop].sample(rand(1..3)) }
      issue.save!
      st = statuses.sample
      if st != issue.status
        issue = Issue.find(issue.id); issue.init_journal(members.sample, "Looked into this. The root cause is in the *adapter* layer — see `lib/adapters/base.rb`.")
        issue.status = st
        issue.save(validate: false)
      end
      if rand < 0.5
        issue = Issue.find(issue.id); issue.init_journal(members.sample, "I can reproduce it on staging.\n\n- Chrome 147: fails\n- Firefox: ok")
        issue.save(validate: false)
      end
      rand(0..2).times do
        TimeEntry.create!(project: p, issue: issue, user: members.sample, author: admin, hours: [0.5, 1, 2, 3.5].sample,
                          spent_on: Date.today - rand(20), activity: activities.sample, comments: 'Investigation')
      end
      members.sample(2).each { |u| Watcher.create(watchable: issue, user: u) }
    end
    ids = p.issues.order(:id).pluck(:id)
    3.times do |i|
      child = Issue.find(ids[i + 1])
      child.parent_issue_id = ids[0]
      child.save(validate: false)
    end
    sub = Issue.find(ids[4]); sub.parent_issue_id = ids[1]; sub.save(validate: false)
    [[5, 6, 'blocks'], [7, 8, 'precedes'], [9, 10, 'relates']].each do |a, b, t|
      IssueRelation.create(issue_from: Issue.find(ids[a]), issue_to: Issue.find(ids[b]), relation_type: t)
    end
    3.times do |i|
      News.create!(project: p, author: members.sample, title: "#{p.name}: sprint #{i + 1} review",
                   summary: 'What shipped, what slipped and what is next.',
                   description: "## Shipped\n\n- New invoice export\n- Faster search\n\n## Next\n\nSee the roadmap.")
    end
    wiki = p.wiki || Wiki.create!(project: p, start_page: 'Wiki')
    page = WikiPage.new(wiki: wiki, title: 'Wiki')
    page.content = WikiContent.new(page: page, author: admin,
      text: "# #{p.name}\n\nWelcome to the project wiki.\n\n## Architecture\n\nThe service is split into **three** layers.\n\n### Conventions\n\n- Commits reference issues: `refs #12`\n- Branches: `feature/…`, `fix/…`\n\n```python\ndef handler(event):\n    return {\"status\": 200, \"body\": event[\"id\"]}\n```\n\n| Env | URL |\n|---|---|\n| staging | https://staging.example.test |\n| production | https://example.test |\n\n{{toc}}\n")
    page.save!
  end
end

q = IssueQuery.find_or_initialize_by(name: 'My open bugs')
q.assign_attributes(user: admin, visibility: IssueQuery::VISIBILITY_PUBLIC, filters: { 'status_id' => { operator: 'o', values: [''] } })
q.save
puts "projects=#{Project.count} issues=#{Issue.count} users=#{User.count} journals=#{Journal.count} time=#{TimeEntry.count} news=#{News.count} wiki=#{WikiPage.count}"
