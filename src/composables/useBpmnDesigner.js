/**
 * BPMN 设计器组合式函数
 * 封装设计器的所有逻辑和状态
 */
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

// 默认的 BPMN XML 模板
const getDefaultXml = () => `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" 
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
             id="definitions"
             targetNamespace="http://bpmn.io/schema/bpmn">
  <process id="process" isExecutable="true">
    <startEvent id="start" name="开始" />
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="process" />
  </bpmndi:BPMNDiagram>
</definitions>`

// 节点默认名称
const getDefaultNodeName = (nodeType) => {
  const names = {
    'startEvent': '开始',
    'endEvent': '结束',
    'task': '任务',
    'userTask': '用户任务',
    'exclusiveGateway': '排他网关'
  }
  return names[nodeType] || '节点'
}

// 节点类型转换
const getNodeType = (nodeType) => {
  if ('startEvent' in nodeType) return 'start'
  if ('endEvent' in nodeType) return 'end'
  if ('userTask' in nodeType) return 'userTask'
  if ('task' in nodeType) return 'task'
  if ('Gateway' in nodeType) return 'gateway'
  return 'task'
}

// BPMN XML 解析函数
const parseBpmnXml = (xml) => {
  const nodes = []
  const transitions = []
  let startNode = null
  
  // 解析节点
  const nodeRegex = /<(startEvent|endEvent|task|userTask|exclusiveGateway)\s+([^>]+)>([^<]*)<\/\1>/gi
  let match
  
  while ((match = nodeRegex.exec(xml)) !== null) {
    const nodeType = match[1]
    const attrs = match[2]
    const content = match[3]
    
    const idMatch = attrs.match(/id="([^"]+)"/)
    const nameMatch = attrs.match(/name="([^"]+)"/)
    
    const nodeId = idMatch ? idMatch[1] : `node_${nodes.length}`
    const nodeName = nameMatch ? nameMatch[1] : getDefaultNodeName(nodeType)
    const nodeTypeNormalized = getNodeType(nodeType)
    
    // 解析审批人配置
    const assigneeTypeMatch = content.match(/name="assigneeType"[^>]*value="([^"]+)"/)
    const candidateUsersMatch = content.match(/name="candidateUsers"[^>]*value="([^"]+)"/)
    const candidateRolesMatch = content.match(/name="candidateRoles"[^>]*value="([^"]+)"/)
    const assignmentStrategyMatch = content.match(/name="assignmentStrategy"[^>]*value="([^"]+)"/)
    const assigneeExpressionMatch = content.match(/name="assigneeExpression"[^>]*value="([^"]+)"/)
    const assigneeRelationMatch = content.match(/name="assigneeRelation"[^>]*value="([^"]+)"/)
    const multiInstanceTypeMatch = content.match(/name="multiInstanceType"[^>]*value="([^"]+)"/)
    const gatewayTypeMatch = content.match(/name="gatewayType"[^>]*value="([^"]+)"/)
    
    const node = {
      key: nodeId,
      name: nodeName,
      type: nodeTypeNormalized,
      assigneeType: assigneeTypeMatch ? assigneeTypeMatch[1] : 'specific',
      candidateUsers: candidateUsersMatch ? candidateUsersMatch[1].split(',').filter(Boolean) : [],
      candidateRoles: candidateRolesMatch ? candidateRolesMatch[1].split(',').filter(Boolean) : [],
      assignmentStrategy: assignmentStrategyMatch ? assignmentStrategyMatch[1] : 'ANYONE',
      assigneeExpression: assigneeExpressionMatch ? assigneeExpressionMatch[1] : '',
      assigneeRelation: assigneeRelationMatch ? assigneeRelationMatch[1] : '',
      multiInstanceType: multiInstanceTypeMatch ? multiInstanceTypeMatch[1] : 'parallel',
      gatewayType: gatewayTypeMatch ? gatewayTypeMatch[1] : 'exclusive'
    }
    
    nodes.push(node)
    
    if (nodeTypeNormalized === 'start') {
      startNode = node
    }
  }
  
  // 解析流转
  const transitionRegex = /<sequenceFlow\s+([^>]+)>/gi
  
  while ((match = transitionRegex.exec(xml)) !== null) {
    const attrs = match[1]
    const sourceRefMatch = attrs.match(/sourceRef="([^"]+)"/)
    const targetRefMatch = attrs.match(/targetRef="([^"]+)"/)
    const conditionExprMatch = attrs.match(/name="conditionExpression"[^>]*value="([^"]+)"/)
    
    const transition = {
      from: sourceRefMatch ? sourceRefMatch[1] : '',
      to: targetRefMatch ? targetRefMatch[1] : ''
    }
    
    if (conditionExprMatch) {
      transition.conditionExpression = conditionExprMatch[1]
    }
    
    transitions.push(transition)
  }
  
  return { nodes, transitions, startNode }
}

// 将 JSON 转换为 BPMN XML
const convertJsonToBpmn = (flowJson) => {
  const nodes = flowJson.nodes || []
  const transitions = flowJson.transitions || []
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" 
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
             id="definitions"
             targetNamespace="http://bpmn.io/schema/bpmn">
  <process id="${flowJson.processId || 'process'}" isExecutable="true">
`
  
  nodes.forEach((node, index) => {
    const nodeType = getBpmnNodeType(node.type)
    const nodeXml = convertNodeToXml(node, index)
    xml += nodeXml
  })
  
  xml += `  </process>\n`
  
  // 添加流转
  transitions.forEach((transition, index) => {
    xml += `  <sequenceFlow id="flow_${index}" sourceRef="${transition.from}" targetRef="${transition.to}"`
    if (transition.conditionExpression) {
      xml += `>\n    <extensionElements>
      <camunda:property name="conditionExpression" value="${transition.conditionExpression}" />
    </extensionElements>
  </sequenceFlow>\n`
    } else {
      xml += ` />\n`
    }
  })
  
  // BPMN DI
  xml += `  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${flowJson.processId || 'process'}" />
  </bpmndi:BPMNDiagram>
</definitions>`
  
  return xml
}

// 获取 BPMN 节点类型
const getBpmnNodeType = (type) => {
  const types = {
    'start': 'startEvent',
    'end': 'endEvent',
    'task': 'task',
    'userTask': 'userTask',
    'gateway': 'exclusiveGateway'
  }
  return types[type] || 'task'
}

// 将节点转换为 XML
const convertNodeToXml = (node, index) => {
  const nodeType = getBpmnNodeType(node.type)
  const nodeId = node.key || `node_${index}`
  
  let xml = `    <${nodeType} id="${nodeId}" name="${node.name}"`
  
  if (node.type === 'userTask' || node.type === 'task') {
    // 添加审批人配置
    const assigneeType = node.assigneeType || 'specific'
    const candidateUsers = (node.candidateUsers || []).join(',')
    const candidateRoles = (node.candidateRoles || []).join(',')
    const assignmentStrategy = node.assignmentStrategy || 'ANYONE'
    const assigneeExpression = node.assigneeExpression || ''
    const assigneeRelation = node.assigneeRelation || ''
    const multiInstanceType = node.multiInstanceType || 'parallel'
    
    xml += `>
      <extensionElements>
        <camunda:properties>
          <camunda:property name="assigneeType" value="${assigneeType}" />
          <camunda:property name="candidateUsers" value="${candidateUsers}" />
          <camunda:property name="candidateRoles" value="${candidateRoles}" />
          <camunda:property name="assignmentStrategy" value="${assignmentStrategy}" />
`
    
    if (assigneeExpression) {
      xml += `          <camunda:property name="assigneeExpression" value="${assigneeExpression}" />
`
    }
    
    if (assigneeRelation) {
      xml += `          <camunda:property name="assigneeRelation" value="${assigneeRelation}" />
`
    }
    
    if (multiInstanceType) {
      xml += `          <camunda:property name="multiInstanceType" value="${multiInstanceType}" />
`
    }
    
    xml += `        </camunda:properties>
      </extensionElements>
      <incoming>flow_${index}</incoming>
      <outgoing>flow_${index + 1}</outgoing>
    </${nodeType}>
`
  } else {
    xml += ` />
`
  }
  
  return xml
}

export function useBpmnDesigner(workflowId = null) {
  // 状态
  const canvasRef = ref(null)
  const bpmnModeler = ref(null)
  const selectedElement = ref(null)
  const elementCounter = ref(0)
  const showSaveModal = ref(false)
  
  // 数据
  const userList = ref([])
  const roleList = ref([])
  const workflowForm = reactive({
    name: '',
    code: '',
    description: ''
  })
  
  // 元素属性
  const elementProperties = reactive({
    name: '',
    id: '',
    type: '',
    description: '',
    assigneeType: 'specific',
    candidateUsers: [],
    candidateRoles: [],
    assignmentStrategy: 'ANYONE',
    assigneeExpression: '',
    assigneeRelation: '',
    multiInstanceType: 'parallel',
    gatewayType: 'exclusive'
  })
  
  // 加载用户列表
  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        userList.value = data.results || data || []
      }
    } catch (error) {
      console.error('加载用户列表失败:', error)
    }
  }
  
  // 加载角色列表
  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        roleList.value = data.results || data || []
      }
    } catch (error) {
      console.error('加载角色列表失败:', error)
    }
  }
  
  // 初始化设计器
  const initDesigner = async () => {
    if (!canvasRef.value) return
    
    // 动态导入 bpmn-js
    const BpmnModeler = (await import('bpmn-js')).default
    
    bpmnModeler.value = new BpmnModeler({
      container: canvasRef.value,
      keyboard: {
        bindTo: document
      }
    })
    
    // 创建默认流程
    await createNewDiagram()
    
    // 加载已有流程
    if (workflowId) {
      await loadWorkflowById(workflowId)
    }
    
    // 监听选择变化
    bpmnModeler.value.on('selection.changed', handleSelectionChanged)
    bpmnModeler.value.on('elementModdleChange.success', handleElementChanged)
  }
  
  // 创建新流程图
  const createNewDiagram = async () => {
    const xml = getDefaultXml()
    await bpmnModeler.value.importXML(xml)
    bpmnModeler.value.get('canvas').zoom('fit-viewport')
  }
  
  // 根据 ID 加载流程
  const loadWorkflowById = async (id) => {
    try {
      const response = await fetch(`/api/workflow/definitions/${id}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        workflowForm.name = data.name
        workflowForm.code = data.code
        workflowForm.description = data.description || ''
        
        // 解析并加载
        if (data.flow_json && data.flow_json.xml) {
          await bpmnModeler.value.importXML(data.flow_json.xml)
        }
      }
    } catch (error) {
      console.error('加载流程失败:', error)
    }
  }
  
  // 处理选择变化
  const handleSelectionChanged = (event) => {
    const { newSelection } = event
    if (newSelection && newSelection.length === 1) {
      selectedElement.value = newSelection[0]
      loadElementAssigneeConfig(newSelection[0])
    } else {
      selectedElement.value = null
    }
  }
  
  // 处理元素变化
  const handleElementChanged = (event) => {
    // 可以在这里添加自动保存等逻辑
  }
  
  // 加载元素审批人配置
  const loadElementAssigneeConfig = (element) => {
    const bo = element.businessObject
    
    // 重置
    elementProperties.assigneeType = 'specific'
    elementProperties.candidateUsers = []
    elementProperties.candidateRoles = []
    elementProperties.assignmentStrategy = 'ANYONE'
    elementProperties.assigneeExpression = ''
    elementProperties.assigneeRelation = ''
    elementProperties.multiInstanceType = 'parallel'
    elementProperties.gatewayType = 'exclusive'
    elementProperties.name = bo.name || ''
    elementProperties.id = bo.id || ''
    elementProperties.type = getNodeType(bo.$type || '')
    
    if (bo && bo.extensionElements) {
      const assigneeConfig = bo.extensionElements.values?.find(
        e => e.$type === 'camunda:Properties'
      )
      
      if (assigneeConfig) {
        const getProp = (name) => assigneeConfig.values?.find(p => p.name === name)
        
        const assigneeType = getProp('assigneeType')
        const candidateUsers = getProp('candidateUsers')
        const candidateRoles = getProp('candidateRoles')
        const assignmentStrategy = getProp('assignmentStrategy')
        const assigneeExpression = getProp('assigneeExpression')
        const assigneeRelation = getProp('assigneeRelation')
        const multiInstanceType = getProp('multiInstanceType')
        const gatewayType = getProp('gatewayType')
        
        if (assigneeType) elementProperties.assigneeType = assigneeType.value || 'specific'
        if (candidateUsers) elementProperties.candidateUsers = candidateUsers.value ? candidateUsers.value.split(',') : []
        if (candidateRoles) elementProperties.candidateRoles = candidateRoles.value ? candidateRoles.value.split(',') : []
        if (assignmentStrategy) elementProperties.assignmentStrategy = assignmentStrategy.value || 'ANYONE'
        if (assigneeExpression) elementProperties.assigneeExpression = assigneeExpression.value || ''
        if (assigneeRelation) elementProperties.assigneeRelation = assigneeRelation.value || ''
        if (multiInstanceType) elementProperties.multiInstanceType = multiInstanceType.value || 'parallel'
        if (gatewayType) elementProperties.gatewayType = gatewayType.value || 'exclusive'
      }
    }
  }
  
  // 生成唯一 ID
  const generateId = (prefix) => {
    elementCounter.value++
    return `${prefix}_${Date.now()}_${elementCounter.value}`
  }
  
  // 获取元素类型
  const getElementType = (element) => {
    const type = element.$type
    if (type.includes('StartEvent')) return 'startEvent'
    if (type.includes('EndEvent')) return 'endEvent'
    if (type.includes('UserTask')) return 'userTask'
    if (type.includes('Gateway')) return 'exclusiveGateway'
    return 'task'
  }
  
  // 更新元素名称
  const updateElementName = () => {
    if (!selectedElement.value) return
    const modeling = bpmnModeler.value.get('modeling')
    modeling.updateLabel(selectedElement.value, elementProperties.name)
  }
  
  // 清除设计器
  const clearDesigner = () => {
    if (bpmnModeler.value) {
      bpmnModeler.value.clear()
    }
  }
  
  // 导出流程
  const exportWorkflow = () => {
    bpmnModeler.value.saveXML({ format: true }, (err, xml) => {
      if (err) {
        ElMessage.error('导出失败')
        return
      }
      const blob = new Blob([xml], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${workflowForm.name || 'workflow'}.bpmn`
      a.click()
      URL.revokeObjectURL(url)
    })
  }
  
  // 验证流程
  const validateWorkflow = () => {
    const elements = bpmnModeler.value.get('elementRegistry').getAll()
    let hasStart = false
    let hasEnd = false
    
    elements.forEach(el => {
      if (el.$type.includes('StartEvent')) hasStart = true
      if (el.$type.includes('EndEvent')) hasEnd = true
    })
    
    if (!hasStart) {
      ElMessage.warning('流程至少需要一个开始节点')
      return false
    }
    if (!hasEnd) {
      ElMessage.warning('流程至少需要一个结束节点')
      return false
    }
    
    return true
  }
  
  // 保存流程
  const saveWorkflow = async () => {
    if (!validateWorkflow()) return
    
    try {
      const { xml } = await bpmnModeler.value.saveXML()
      const parsed = parseBpmnXml(xml)
      
      const flowJson = {
        xml,
        nodes: parsed.nodes,
        transitions: parsed.transitions
      }
      
      const payload = {
        name: workflowForm.name,
        code: workflowForm.code,
        description: workflowForm.description,
        flow_json: flowJson
      }
      
      let response
      if (workflowId) {
        response = await fetch(`/api/workflow/definitions/${workflowId}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        })
      } else {
        response = await fetch('/api/workflow/definitions/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        })
      }
      
      if (response.ok) {
        ElMessage.success('保存成功')
        showSaveModal.value = false
      } else {
        const error = await response.json()
        ElMessage.error(error.error || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      ElMessage.error('保存失败')
    }
  }
  
  // 添加元素
  const addElement = (type, properties = {}) => {
    const elementFactory = bpmnModeler.value.get('elementFactory')
    const create = bpmnModeler.value.get('creatore')
    const modeling = bpmnModeler.value.get('modeling')
    
    const suffix = generateId(type)
    const attrs = {
      type: type,
      name: properties.name || getDefaultNodeName(type),
      id: suffix
    }
    
    const newElement = elementFactory.create(attrs)
    
    // 添加到画布
    create.start()
  }
  
  // 添加开始节点
  const addStartEvent = () => addElement('bpmn:StartEvent', { name: '开始' })
  
  // 添加结束节点
  const addEndEvent = () => addElement('bpmn:EndEvent', { name: '结束' })
  
  // 添加任务
  const addTask = () => addElement('bpmn:Task', { name: '任务' })
  
  // 添加用户任务
  const addUserTask = () => addElement('bpmn:UserTask', { name: '用户任务' })
  
  // 添加网关
  const addGateway = () => addElement('bpmn:ExclusiveGateway', { name: '网关' })
  
  // 销毁
  const destroy = () => {
    if (bpmnModeler.value) {
      bpmnModeler.value.destroy()
    }
  }
  
  return {
    // 状态
    canvasRef,
    bpmnModeler,
    selectedElement,
    showSaveModal,
    workflowForm,
    elementProperties,
    userList,
    roleList,
    
    // 方法
    loadUsers,
    loadRoles,
    initDesigner,
    handleSelectionChanged,
    loadElementAssigneeConfig,
    generateId,
    getElementType,
    updateElementName,
    clearDesigner,
    exportWorkflow,
    validateWorkflow,
    saveWorkflow,
    addStartEvent,
    addEndEvent,
    addTask,
    addUserTask,
    addGateway,
    addElement,
    destroy,
    
    // 解析工具
    parseBpmnXml,
    convertJsonToBpmn,
    getDefaultXml,
    getDefaultNodeName,
    getNodeType
  }
}
