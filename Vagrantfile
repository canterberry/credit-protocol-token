Vagrant.configure('2') do |vagrant|
  node = {
    address: '192.168.230.10',
    name: 'credit-protocol-token',
    memory: 512
  }

  vagrant.vm.define(node[:name]) do |machine|
    machine.vm.box = 'debian/stretch64'
    machine.vm.hostname = node[:name]

    machine.vm.provider('virtualbox') do |virtualbox|
      virtualbox.name = node[:name]
      virtualbox.linked_clone = true
      virtualbox.memory = node[:memory]
      virtualbox.cpus = 1
    end

    machine.vm.network('private_network', ip: node[:address])
    machine.vm.post_up_message = ''
    machine.vm.synced_folder('.', '/vagrant', disabled: false)

    machine.vm.provision('shell', path: 'Vagrantfile.provision.sh')
  end
end
