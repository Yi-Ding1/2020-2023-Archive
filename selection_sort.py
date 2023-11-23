def selection_sort(list):
    n = len(list)
    for j in range(n):
        min = j

        #find the item in the list that has greater value, if greater value found, swap item
        for i in range(j,n):
            if list[i] < list[min]:
                min = i
        if min != j:
            list[j],list[min] = list[min],list[j]
    return(list)

list = ['Rupert', 'Michael', 'Jack', 'Jordan', 'Harris', 'Monty', 'Samuel', 'Olivia', 'Callum', 'Sam', 'Harry']
print(list)
print(selection_sort(list))