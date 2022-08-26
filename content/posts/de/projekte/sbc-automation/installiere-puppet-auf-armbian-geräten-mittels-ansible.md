---
Title:      Installiere Puppet auf Armbian Geräten mittels Ansible
Menuname:   Puppet via Ansible
Summary:    Ein Ansible playbook um Puppet auf Armbian Geräten zu installieren.
Language:   de
Keywords:   automatisierung, ansible, puppet, armbian, playbook, installation
Authors:    René Zingerle, SSCP
TwitterA:   r9_rtec
Timestamp:  2022-08-26_07:14:54
Image:      content/images/posts/projects/sbc-automation/Install_Puppet_via_Ansible.png
Alt:        Um zu zeigen das dieser Leitfaden Ansible und Puppet für Automatisierung verwendet kannst du Pfeile sehen die einen Kreis formen. Darüber steht Puppet und darunter Ansible.
Index:      0
ChangeFreq: monthly
Priority:   0.8
base_url:   de/blog/projekte/sbc-automation/installiere-puppet-auf-armbian-geräten-mittels-ansible.html
child:      none
parent:     none
template:   single-post.html
state:      ready
robots:     index, follow
---

# Installiere Puppet auf Armbian Geräten mittels Ansible

Starte mit Automatisierung in dem du mit diesem Ansible playbook, Puppet über SSH installierst.

## Playbook

```
---
- name: "Install puppet agent on Armbian"
  hosts: armbian-devices
  #serial: 1

  vars:
      ruby_version: "3.0.0"
      ansible_python_interpreter: "/usr/bin/python3"
      rvm_path: "/usr/local/rvm/gems/ruby-{{ ruby_version }}/bin:/usr/local/rvm/gems/ruby-{{ ruby_version }}@global/bin:/usr/local/rvm/rubies/ruby-{{ ruby_version }}/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/local/rvm/bin"

  tasks:

    - name: Install curl and gnupg2
      apt:
        pkg:
          - curl
          - gnupg2
        state: present
        update_cache: yes

    - name: Add PATH to /etc/profile
      ansible.builtin.blockinfile:
        path: /root/.profile
        block: |
          PATH={{ rvm_path }}:$PATH
          export GEM_HOME='/usr/local/rvm/gems/ruby-{{ ruby_version }}'
          export GEM_PATH='/usr/local/rvm/gems/ruby-{{ ruby_version }}:/usr/local/rvm/gems/ruby-{{ ruby_version }}@global'

    - name: ensure that GPG key for RVM is installed
      command:  gpg2 --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3 7D2BAF1CF37B13E2069D6956105BD0E739499BDB
      args:
        creates: /root/.gnupg/trustdb.gpg

    - name: ensure that RVM and ruby is installed
      shell: curl -sSL https://get.rvm.io | bash -s stable --ruby
      args:
        creates: "/usr/local/rvm/gems/ruby-{{ ruby_version }}/"

    - name: ensure that ruby is installed
      command: "rvm install {{ ruby_version }}"
      args:
        creates: "/usr/local/rvm/gems/ruby-{{ ruby_version }}/"

    - name: Add the user 'root' to the group rvm
      ansible.builtin.user:
        name: root
        group: rvm

    - name: Install puppet
      command: "gem install puppet"
      args:
        creates: "/usr/local/rvm/gems/ruby-{{ ruby_version }}/bin/puppet"

    - name: Install facter
      command: "gem install facter"
      args:
        creates: "/usr/local/rvm/gems/ruby-{{ ruby_version }}/bin/facter"

    - name: Create puppet directory
      file:
        path: /etc/puppetlabs/puppet
        state: directory

    - name: Change puppet.conf
      ansible.posix.synchronize:
        src: configs/puppet/puppet.conf
        dest: /etc/puppetlabs/puppet/puppet.conf
        delete: yes

    - name: Create facter directory
      file:
        path: /etc/puppetlabs/facter/facts.d/
        state: directory

    - name: Change os.yaml
      ansible.posix.synchronize:
        src: configs/puppet/armbian.yml
        dest: /etc/puppetlabs/facter/facts.d/os.yaml
        delete: yes

    - name: Puppet SSL bootstrap
      shell: |
        #!/usr/bin/env bash
        PATH={{ rvm_path }}:$PATH
        export GEM_HOME='/usr/local/rvm/gems/ruby-{{ ruby_version }}'
        export GEM_PATH='/usr/local/rvm/gems/ruby-{{ ruby_version }}:/usr/local/rvm/gems/ruby-{{ ruby_version }}@global'
        /usr/local/rvm/gems/ruby-{{ ruby_version }}/bin/puppet ssl bootstrap
      environment:
        PATH: "{{ rvm_path }}:{{ ansible_env.PATH }}"

    - name: Create /root/exec_puppet.sh
      copy:
        dest: /root/exec_puppet.sh
        content: |
          #!/usr/bin/env bash
          PATH={{ rvm_path }}:$PATH
          export GEM_HOME='/usr/local/rvm/gems/ruby-{{ ruby_version }}'
          export GEM_PATH='/usr/local/rvm/gems/ruby-{{ ruby_version }}:/usr/local/rvm/gems/ruby-{{ ruby_version }}@global'
          /usr/local/rvm/gems/ruby-{{ ruby_version }}/bin/puppet agent -t

    - name: Ensure puppet-agent update every 30 minute
      ansible.builtin.cron:
        name: "update puppet agent by which"
        minute: "*/30"
        job: "/bin/bash /root/exec_puppet.sh 2>&1 > /dev/null"
```

## Ein Dank an:

Einige Ideen und Umsetzungen in diesem Beitrag wurden durch folgende Artikel inspiriert.

- [https://linuxconfig.org/how-to-set-up-rvm-on-debian-10-buster](https://linuxconfig.org/how-to-set-up-rvm-on-debian-10-buster)
- [https://dangibbs.uk/blog/running-puppet-7-agent-on-arm/](https://dangibbs.uk/blog/running-puppet-7-agent-on-arm/)
- [https://serverfault.com/questions/436217/install-rvm-with-ansible](https://serverfault.com/questions/436217/install-rvm-with-ansible)
- [https://github.com/rvm/rvm1-ansible](https://github.com/rvm/rvm1-ansible)
- [https://ericlondon.com/2013/08/26/bash-shell-wrapper-script-to-setup-rvm-environment-and-execute-ruby-scripts-via-cron.html](https://ericlondon.com/2013/08/26/bash-shell-wrapper-script-to-setup-rvm-environment-and-execute-ruby-scripts-via-cron.html)
